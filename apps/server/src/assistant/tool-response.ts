import type {
  MathEvaluationResult,
  NumericMetric,
  SystemMetricsResponse,
} from "@projeto-home/contracts";

export function createMetricsResponse(
  query: string,
  metrics: SystemMetricsResponse,
): string {
  const normalized = normalize(query);
  const parts = selectMetricParts(normalized, metrics);
  return `Dados atuais do servidor: ${parts.join("; ")}.`;
}

export function createCalculationResponse(result: MathEvaluationResult): string {
  return `O resultado de ${result.expression} é ${formatNumber(result.value)}.`;
}

function selectMetricParts(query: string, metrics: SystemMetricsResponse): string[] {
  const storage = formatBytePair(
    "Armazenamento dispon\u00edvel",
    metrics.storage.availableBytes,
    metrics.storage.totalBytes,
  );
  const memory = formatBytePair(
    "Mem\u00f3ria dispon\u00edvel",
    metrics.memory.availableBytes,
    metrics.memory.totalBytes,
  );
  const swap = formatBytePair("Swap usada", metrics.swap.usedBytes, metrics.swap.totalBytes);
  const cpu = formatTemperature("Temperatura da CPU", metrics.temperatures.cpuCelsius);
  const battery = formatTemperature("Temperatura da bateria", metrics.temperatures.batteryCelsius);
  const uptime = `Uptime: ${formatDuration(metrics.serverUptimeSeconds)}`;

  if (includesAny(query, ["armazenamento", "espaco"])) return [storage];
  if (includesAny(query, ["memoria"])) return [memory];
  if (includesAny(query, ["swap"])) return [swap];
  const asksCpu = includesAny(query, ["cpu"]);
  const asksBattery = includesAny(query, ["bateria"]);
  if (asksCpu || asksBattery) return [
    ...(asksCpu ? [cpu] : []),
    ...(asksBattery ? [battery] : []),
  ];
  if (includesAny(query, ["temperatura"])) return [cpu, battery];
  if (includesAny(query, ["uptime"])) return [uptime];
  return [uptime, memory, swap, storage, cpu, battery];
}

function formatBytePair(label: string, value: NumericMetric, total: NumericMetric): string {
  if (value.status !== "available" || total.status !== "available") {
    return `${label}: indispon\u00edvel`;
  }
  return `${label}: ${formatGigabytes(value.value)} de ${formatGigabytes(total.value)}`;
}

function formatTemperature(label: string, metric: NumericMetric): string {
  return metric.status === "available"
    ? `${label}: ${formatNumber(metric.value)} \u00b0C`
    : `${label}: indispon\u00edvel`;
}

function formatGigabytes(value: number): string {
  return `${(value / 1024 ** 3).toFixed(1)} GB`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
}

function includesAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
