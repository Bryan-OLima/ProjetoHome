import { useEffect, useState } from "react";
import type { OperationalLogEvent } from "@projeto-home/contracts";
import { getOperationalLogs } from "./api.js";

type RecentActivityState =
  | { state: "loading" }
  | { state: "ready"; items: OperationalLogEvent[] }
  | { state: "unavailable" }
  | { state: "error" };

export function RecentActivityPanel() {
  const [state, setState] = useState<RecentActivityState>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    getOperationalLogs({ limit: 5 }, controller.signal)
      .then((response) => setState({ state: "ready", items: response.items }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const isApiFailure = error instanceof Error && error.message.startsWith("api_request_failed:");
        setState({ state: isApiFailure ? "error" : "unavailable" });
      });
    return () => controller.abort();
  }, []);

  if (state.state === "loading") return <section className="activity-panel">Carregando atividade recente…</section>;
  if (state.state === "unavailable") return <section className="activity-panel" role="alert">Atividade recente indisponível no momento.</section>;
  if (state.state === "error") return <section className="activity-panel" role="alert">Não foi possível carregar a atividade recente agora.</section>;

  return (
    <section className="activity-panel" aria-label="Atividade recente">
      <h2>Atividade recente</h2>
      {state.items.length === 0 ? (
        <p className="activity-empty">Nenhum evento operacional recente.</p>
      ) : (
        <ul className="activity-list">
          {state.items.map((event, index) => (
            <li key={`${event.timestamp}-${event.action}-${index}`}>
              <span className={`activity-level activity-level--${event.level}`}>{event.level}</span>
              <strong>{event.action}</strong>
              <span>{event.service}</span>
              <time dateTime={event.timestamp}>{new Date(event.timestamp).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
