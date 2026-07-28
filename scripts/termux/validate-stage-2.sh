#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_HOME="$(cd "$SCRIPT_DIR/../.." && pwd)"
VALIDATION_ROOT="$PROJECT_HOME/var/validation/stage-2-$(date -u +%Y%m%dT%H%M%SZ)"
DATABASE_PATH="$VALIDATION_ROOT/projeto-home.sqlite"
LOG_DIRECTORY="$VALIDATION_ROOT/log"
PORT="${STAGE_2_VALIDATION_PORT:-3102}"
SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill -TERM "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

mkdir -p "$VALIDATION_ROOT"
cd "$PROJECT_HOME"

npm ci
npm run typecheck
npm test
npm run build

NODE_ENV=production \
HOST=127.0.0.1 \
PORT="$PORT" \
DATABASE_PATH="$DATABASE_PATH" \
LOG_DIRECTORY="$LOG_DIRECTORY" \
node apps/server/dist/index.js >"$VALIDATION_ROOT/server.stdout.log" 2>"$VALIDATION_ROOT/server.stderr.log" &
SERVER_PID="$!"

HEALTH_FILE="$VALIDATION_ROOT/health.json"
for attempt in {1..30}; do
  if node -e 'fetch(process.argv[1]).then(async (response) => { if (!response.ok) process.exit(1); process.stdout.write(await response.text()); }).catch(() => process.exit(1));' "http://127.0.0.1:$PORT/health" >"$HEALTH_FILE"; then
    break
  fi
  sleep 1
done

if [[ ! -s "$HEALTH_FILE" ]]; then
  echo "O servidor não respondeu ao health check. Evidências: $VALIDATION_ROOT" >&2
  exit 1
fi

REQUEST_ID="$(node -e 'const fs = require("node:fs"); const health = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); if (!health.requestId) process.exit(1); process.stdout.write(health.requestId);' "$HEALTH_FILE")"

OPERATIONAL_LOGS_FILE="$VALIDATION_ROOT/operational-logs.json"
node -e 'fetch(process.argv[1]).then(async (response) => { if (!response.ok) process.exit(1); process.stdout.write(await response.text()); }).catch(() => process.exit(1));' "http://127.0.0.1:$PORT/api/observability/operational-logs?limit=1" >"$OPERATIONAL_LOGS_FILE"

node - "$OPERATIONAL_LOGS_FILE" <<'NODE'
const { readFileSync } = require("node:fs");

const payload = JSON.parse(readFileSync(process.argv[2], "utf8"));
if (!Array.isArray(payload.items) || typeof payload.truncated !== "boolean") {
  throw new Error("invalid_operational_log_query_response");
}
NODE

node - "$DATABASE_PATH" "$LOG_DIRECTORY/operational.jsonl" "$REQUEST_ID" <<'NODE'
const { DatabaseSync } = require("node:sqlite");
const { existsSync, readFileSync } = require("node:fs");

const [databasePath, logPath, requestId] = process.argv.slice(2);
const database = new DatabaseSync(databasePath, { readOnly: true });

try {
  const integrity = database.prepare("PRAGMA integrity_check").get();
  if (integrity.integrity_check !== "ok") throw new Error("integrity_check_failed");

  const tables = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
    .all()
    .map((row) => row.name);
  for (const requiredTable of ["audit_events", "error_events"]) {
    if (!tables.includes(requiredTable)) throw new Error(`missing_table:${requiredTable}`);
  }

  if (!existsSync(logPath)) throw new Error("missing_operational_log");
  const log = readFileSync(logPath, "utf8");
  if (!log.includes(requestId)) throw new Error("missing_request_correlation");
  if (/password=|access_token=|refresh_token=|api_key=|cookie:/i.test(log)) {
    throw new Error("sensitive_pattern_in_log");
  }

  console.log(JSON.stringify({
    integrity: "ok",
    tables: ["audit_events", "error_events"],
    requestId,
    operationalLog: "correlated",
  }));
} finally {
  database.close();
}
NODE

echo "Validação da Etapa 2 aprovada. Evidências: $VALIDATION_ROOT"
