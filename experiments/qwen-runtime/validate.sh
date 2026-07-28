#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

MODEL_PATH="${MODEL_PATH:-$HOME/ProjetoHome/models/Qwen_Qwen3-1.7B-Q4_K_M.gguf}"
EXPECTED_SHA256="72c5c3cb38fa32d5256e2fe30d03e7a64c6c79e668ad84057e3bd66e250b24fb"
RUN_ID="$(date +%Y%m%d-%H%M%S)"
RESULT_DIR="${RESULT_DIR:-$PWD/results/$RUN_ID}"
PROMPT="/no_think Responda em português e em no máximo três frases: explique por que uma automação residencial deve confirmar o estado de um dispositivo após enviar um comando."

mkdir -p "$RESULT_DIR"

for command_name in llama-cli llama-bench sha256sum; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Comando ausente: %s\n' "$command_name" >&2
    exit 1
  fi
done

TIME_BIN="$(type -P time || true)"
if [[ -z "$TIME_BIN" ]]; then
  printf 'Comando ausente: time (instale com: pkg install time)\n' >&2
  exit 1
fi

if [[ ! -f "$MODEL_PATH" ]]; then
  printf 'Modelo não encontrado: %s\n' "$MODEL_PATH" >&2
  exit 1
fi

ACTUAL_SHA256="$(sha256sum "$MODEL_PATH" | awk '{print $1}')"
if [[ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]]; then
  printf 'SHA-256 inválido: %s\n' "$ACTUAL_SHA256" >&2
  exit 1
fi

{
  printf 'run_id=%s\n' "$RUN_ID"
  printf 'model=%s\n' "$MODEL_PATH"
  printf 'sha256=%s\n' "$ACTUAL_SHA256"
  printf 'uname=%s\n' "$(uname -a)"
  printf 'llama_cli=%s\n' "$(llama-cli --version 2>&1 | head -n 1)"
  printf 'llama_bench=%s\n' "$(llama-bench --version 2>&1 | head -n 1)"
  printf 'threads=4\n'
  printf 'context=4096\n'
} > "$RESULT_DIR/environment.txt"

cp /proc/meminfo "$RESULT_DIR/meminfo-before.txt"
if [[ -r /sys/class/power_supply/battery/temp ]]; then
  cp /sys/class/power_supply/battery/temp "$RESULT_DIR/temperature-before.txt"
fi

llama-bench \
  -m "$MODEL_PATH" \
  -p 512 \
  -n 128 \
  -t 4 \
  -ngl 0 \
  -r 3 \
  2>&1 | tee "$RESULT_DIR/benchmark.txt"

"$TIME_BIN" -v \
  llama-cli \
  -m "$MODEL_PATH" \
  -p "$PROMPT" \
  -n 128 \
  -t 4 \
  -c 4096 \
  -ngl 0 \
  --jinja \
  --single-turn \
  --no-display-prompt \
  --no-warmup \
  --temp 0.7 \
  --top-k 20 \
  --top-p 0.8 \
  --min-p 0 \
  --presence-penalty 1.5 \
  > "$RESULT_DIR/response.txt" \
  2> "$RESULT_DIR/inference-metrics.txt"

cp /proc/meminfo "$RESULT_DIR/meminfo-after.txt"
if [[ -r /sys/class/power_supply/battery/temp ]]; then
  cp /sys/class/power_supply/battery/temp "$RESULT_DIR/temperature-after.txt"
fi

printf '\nValidação concluída. Resultados: %s\n' "$RESULT_DIR"
printf '\nResposta do modelo:\n'
cat "$RESULT_DIR/response.txt"

SHARED_RESULTS="$HOME/storage/downloads/ProjetoHome/results/qwen-runtime"
if [[ -d "$HOME/storage/downloads" && -w "$HOME/storage/downloads" ]]; then
  mkdir -p "$SHARED_RESULTS"
  cp -r "$RESULT_DIR" "$SHARED_RESULTS/"
  printf '\nCópia compartilhada: %s/%s\n' "$SHARED_RESULTS" "$RUN_ID"
fi
