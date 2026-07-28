#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

MODEL_PATH="${MODEL_PATH:-$HOME/ProjetoHome/models/Qwen_Qwen3-1.7B-Q4_K_M.gguf}"
RUN_ID="$(date +%Y%m%d-%H%M%S)"
RESULT_DIR="${RESULT_DIR:-$PWD/results/api-$RUN_ID}"
PORT="${PORT:-18080}"
SERVER_PID=""

mkdir -p "$RESULT_DIR"

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID"
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

for command_name in llama-server curl; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Comando ausente: %s\n' "$command_name" >&2
    exit 1
  fi
done

if [[ ! -f "$MODEL_PATH" ]]; then
  printf 'Modelo não encontrado: %s\n' "$MODEL_PATH" >&2
  exit 1
fi

if [[ -r /sys/class/power_supply/battery/temp ]]; then
  cp /sys/class/power_supply/battery/temp "$RESULT_DIR/temperature-before.txt"
fi

llama-server \
  -m "$MODEL_PATH" \
  -c 4096 \
  -t 4 \
  -ngl 0 \
  --host 127.0.0.1 \
  --port "$PORT" \
  > "$RESULT_DIR/server.log" 2>&1 &
SERVER_PID="$!"

for _ in $(seq 1 120); do
  if curl -fsS "http://127.0.0.1:$PORT/health" > "$RESULT_DIR/health.json" 2>/dev/null; then
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    printf 'O servidor encerrou durante a inicialização.\n' >&2
    tail -n 40 "$RESULT_DIR/server.log" >&2
    exit 1
  fi
  sleep 1
done

if ! curl -fsS "http://127.0.0.1:$PORT/health" >/dev/null; then
  printf 'O servidor não ficou pronto em 120 segundos.\n' >&2
  exit 1
fi

grep -E '^(VmPeak|VmSize|VmHWM|VmRSS):' "/proc/$SERVER_PID/status" > "$RESULT_DIR/memory-loaded.txt"
START_SECONDS="$(date +%s)"

curl -fsS --max-time 180 \
  -X POST "http://127.0.0.1:$PORT/v1/chat/completions" \
  -H 'Content-Type: application/json' \
  --data '{"model":"Qwen3-1.7B-Q4_K_M","messages":[{"role":"user","content":"/no_think Responda em português e em no máximo três frases: explique por que uma automação residencial deve confirmar o estado de um dispositivo após enviar um comando."}],"max_tokens":128,"temperature":0.7,"top_p":0.8,"presence_penalty":1.5}' \
  > "$RESULT_DIR/response.json"

END_SECONDS="$(date +%s)"
printf 'elapsed_seconds=%s\n' "$((END_SECONDS - START_SECONDS))" > "$RESULT_DIR/request-metrics.txt"
grep -E '^(VmPeak|VmSize|VmHWM|VmRSS):' "/proc/$SERVER_PID/status" > "$RESULT_DIR/memory-after-request.txt"

if [[ -r /sys/class/power_supply/battery/temp ]]; then
  cp /sys/class/power_supply/battery/temp "$RESULT_DIR/temperature-after.txt"
fi

cleanup
SERVER_PID=""

SHARED_RESULTS="$HOME/storage/downloads/ProjetoHome/results/qwen-runtime"
if [[ -d "$HOME/storage/downloads" && -w "$HOME/storage/downloads" ]]; then
  mkdir -p "$SHARED_RESULTS"
  cp -r "$RESULT_DIR" "$SHARED_RESULTS/"
fi

printf 'Validação da API concluída: %s\n' "$RESULT_DIR"
cat "$RESULT_DIR/response.json"
printf '\n'
