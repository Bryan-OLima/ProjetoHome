#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_HOME="$(cd "$SCRIPT_DIR/../.." && pwd)"
PID_FILE="$PROJECT_HOME/var/run/supervisor.pid"

if [[ ! -r "$PID_FILE" ]]; then
  echo "Servidor não está em execução."
  exit 0
fi

pid="$(cat "$PID_FILE")"
if [[ ! "$pid" =~ ^[0-9]+$ ]] || ! kill -0 "$pid" 2>/dev/null; then
  rm -f "$PID_FILE"
  echo "Nenhum supervisor ativo foi encontrado."
  exit 0
fi

kill -TERM "$pid"
echo "Sinal de parada enviado ao supervisor $pid."
