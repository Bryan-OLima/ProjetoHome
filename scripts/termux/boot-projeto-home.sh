#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

PROJECT_HOME="${PROJECT_HOME:-$HOME/ProjetoHome}"
SUPERVISOR="$PROJECT_HOME/scripts/termux/supervisor.sh"
PID_FILE="$PROJECT_HOME/var/run/supervisor.pid"

if [[ -r "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  exit 0
fi

mkdir -p "$PROJECT_HOME/var/log"
nohup bash "$SUPERVISOR" >> "$PROJECT_HOME/var/log/boot.log" 2>&1 &
