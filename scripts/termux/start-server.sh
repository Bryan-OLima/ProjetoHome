#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_HOME="$(cd "$SCRIPT_DIR/../.." && pwd)"
SERVER_HOME="$PROJECT_HOME/apps/server"
WEB_INDEX="$PROJECT_HOME/apps/web/dist/index.html"

if [[ ! -f "$SERVER_HOME/dist/index.js" || ! -f "$WEB_INDEX" ]]; then
  echo "Build de produção ausente. Execute npm run build na raiz do projeto." >&2
  exit 1
fi

export NODE_ENV="${NODE_ENV:-production}"
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3000}"

cd "$SERVER_HOME"
exec node dist/index.js
