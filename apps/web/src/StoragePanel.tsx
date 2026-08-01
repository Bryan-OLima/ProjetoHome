import { useEffect, useState } from "react";
import type { NumericMetric, StorageSummaryResponse } from "@projeto-home/contracts";
import { getStorageSummary } from "./api.js";

type StorageState =
  | { state: "loading" }
  | { state: "ready"; summary: StorageSummaryResponse }
  | { state: "unavailable" }
  | { state: "error" };

export function StoragePanel() {
  const [state, setState] = useState<StorageState>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    getStorageSummary(controller.signal)
      .then((summary) => setState({ state: "ready", summary }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const isApiFailure = error instanceof Error && error.message.startsWith("api_request_failed:");
        setState({ state: isApiFailure ? "error" : "unavailable" });
      });
    return () => controller.abort();
  }, []);

  if (state.state === "loading") return <section className="storage-panel">Carregando armazenamento…</section>;
  if (state.state === "unavailable") return <section className="storage-panel" role="alert">Armazenamento indisponível no momento.</section>;
  if (state.state === "error") return <section className="storage-panel" role="alert">Não foi possível carregar o armazenamento agora.</section>;

  const location = state.summary.locations[0];
  if (!location) return <section className="storage-panel" role="alert">Não foi possível carregar o armazenamento agora.</section>;
  return (
    <section className="storage-panel" aria-label="Armazenamento">
      <h2>{location.label}</h2>
      {location.status === "unavailable" ? (
        <p>Raiz autorizada indisponível no momento.</p>
      ) : (
        <div className="storage-panel__metrics">
          <StorageMetric label="Disponível" metric={location.availableBytes} />
          <StorageMetric label="Usado" metric={location.usedBytes} />
          <StorageMetric label="Total" metric={location.totalBytes} />
        </div>
      )}
    </section>
  );
}

function StorageMetric({ label, metric }: { label: string; metric: NumericMetric }) {
  return <div><span>{label}</span><strong>{formatBytes(metric)}</strong></div>;
}

function formatBytes(metric: NumericMetric) {
  return metric.status === "available" ? `${(metric.value / 1024 ** 3).toFixed(1)} GB` : "Indisponível";
}
