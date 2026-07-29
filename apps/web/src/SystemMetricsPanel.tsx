import { useEffect, useState } from "react";
import type { NumericMetric, SystemMetricsResponse } from "@projeto-home/contracts";
import { getSystemMetrics } from "./api.js";

type MetricsState =
  | { state: "loading" }
  | { state: "ready"; metrics: SystemMetricsResponse }
  | { state: "unavailable" }
  | { state: "error" };

export function SystemMetricsPanel() {
  const [state, setState] = useState<MetricsState>({ state: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    getSystemMetrics(controller.signal)
      .then((metrics) => setState({ state: "ready", metrics }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const isApiFailure = error instanceof Error && error.message.startsWith("api_request_failed:");
        setState({ state: isApiFailure ? "error" : "unavailable" });
      });
    return () => controller.abort();
  }, []);

  if (state.state === "loading") return <section className="metrics-panel">Carregando métricas…</section>;
  if (state.state === "unavailable") return <section className="metrics-panel" role="alert">Métricas indisponíveis no momento.</section>;
  if (state.state === "error") return <section className="metrics-panel" role="alert">Não foi possível carregar as métricas agora.</section>;

  const { metrics } = state;
  return (
    <section className="metrics-panel" aria-label="Métricas do aparelho">
      <h2>Monitoramento</h2>
      <div className="metrics-grid">
        <MetricCard label="Uptime do servidor" value={formatDuration(metrics.serverUptimeSeconds)} />
        <MetricCard label="Memória disponível" value={formatBytes(metrics.memory.availableBytes)} />
        <MetricCard label="Swap usada" value={formatBytes(metrics.swap.usedBytes)} />
        <MetricCard label="Armazenamento disponível" value={formatBytes(metrics.storage.availableBytes)} />
        <MetricCard label="CPU" value={formatTemperature(metrics.temperatures.cpuCelsius)} />
        <MetricCard label="Bateria" value={formatTemperature(metrics.temperatures.batteryCelsius)} />
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return <div className="metric-card"><span>{label}</span><strong>{value}</strong></div>;
}

function formatBytes(metric: NumericMetric) {
  return metric.status === "available" ? `${(metric.value / 1024 ** 3).toFixed(1)} GB` : "Indisponível";
}

function formatTemperature(metric: NumericMetric) {
  return metric.status === "available" ? `${metric.value.toFixed(1)} °C` : "Indisponível";
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${Math.floor(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
