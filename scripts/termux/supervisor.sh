#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_HOME="$(cd "$SCRIPT_DIR/../.." && pwd)"
RUN_DIR="$PROJECT_HOME/var/run"
LOG_DIR="$PROJECT_HOME/var/log"
LOCK_DIR="$RUN_DIR/supervisor.lock"
SUPERVISOR_PID_FILE="$RUN_DIR/supervisor.pid"
SERVER_PID_FILE="$RUN_DIR/server.pid"
SUPERVISOR_LOG="$LOG_DIR/supervisor.log"
child_pid=""

mkdir -p "$RUN_DIR" "$LOG_DIR"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "Supervisor já está ativo." >&2
  exit 1
fi

cleanup() {
  if [[ -n "$child_pid" ]] && kill -0 "$child_pid" 2>/dev/null; then
    kill -TERM "$child_pid" 2>/dev/null || true
    wait "$child_pid" 2>/dev/null || true
  fi
  rm -f "$SERVER_PID_FILE" "$SUPERVISOR_PID_FILE"
  rmdir "$LOCK_DIR" 2>/dev/null || true
  if command -v termux-wake-unlock >/dev/null 2>&1; then
    termux-wake-unlock
  fi
}

trap 'exit 0' INT TERM
trap cleanup EXIT

echo "$$" > "$SUPERVISOR_PID_FILE"
if command -v termux-wake-lock >/dev/null 2>&1; then
  termux-wake-lock
fi

delay_seconds=1
while true; do
  printf '%s server.start\n' "$(date -Iseconds)" >> "$SUPERVISOR_LOG"
  bash "$SCRIPT_DIR/start-server.sh" >> "$SUPERVISOR_LOG" 2>&1 &
  child_pid="$!"
  echo "$child_pid" > "$SERVER_PID_FILE"

  exit_code=0
  wait "$child_pid" || exit_code="$?"
  child_pid=""
  rm -f "$SERVER_PID_FILE"
  printf '%s server.exit code=%s restart_in=%ss\n' "$(date -Iseconds)" "$exit_code" "$delay_seconds" >> "$SUPERVISOR_LOG"
  sleep "$delay_seconds"
  if (( delay_seconds < 60 )); then
    delay_seconds=$((delay_seconds * 2))
  fi
done
