import { useEffect, useState } from "react";
import type { ListStorageItemsResponse, NumericMetric, StorageSummaryResponse } from "@projeto-home/contracts";
import { getStorageItems, getStorageSummary } from "./api.js";

type StorageState =
  | { state: "loading" }
  | { state: "ready"; summary: StorageSummaryResponse }
  | { state: "unavailable" }
  | { state: "error" };
type ItemsState = { state: "loading" } | { state: "ready"; items: ListStorageItemsResponse } | { state: "unavailable" };

export function StoragePanel() {
  const [state, setState] = useState<StorageState>({ state: "loading" });
  const [itemsState, setItemsState] = useState<ItemsState>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    getStorageSummary(controller.signal)
      .then((summary) => setState({ state: "ready", summary }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const isApiFailure = error instanceof Error && error.message.startsWith("api_request_failed:");
        setState({ state: isApiFailure ? "error" : "unavailable" });
      });
    getStorageItems(controller.signal)
      .then((items) => setItemsState({ state: "ready", items }))
      .catch(() => setItemsState({ state: "unavailable" }));
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
      <StorageItems state={itemsState} />
    </section>
  );
}

function StorageItems({ state }: { state: ItemsState }) {
  if (state.state === "loading") return <p>Carregando inventário…</p>;
  if (state.state === "unavailable") return <p>Inventário indisponível no momento.</p>;
  if (state.items.items.length === 0) return <p>Nenhum item na raiz autorizada.</p>;
  return <ul className="storage-items">{state.items.items.map((item) => <li key={item.name}><strong>{item.name}</strong><span>{item.kind} · {formatBytes({ status: "available", value: item.sizeBytes })}</span></li>)}</ul>;
}

function StorageMetric({ label, metric }: { label: string; metric: NumericMetric }) {
  return <div><span>{label}</span><strong>{formatBytes(metric)}</strong></div>;
}

function formatBytes(metric: NumericMetric) {
  return metric.status === "available" ? `${(metric.value / 1024 ** 3).toFixed(1)} GB` : "Indisponível";
}
