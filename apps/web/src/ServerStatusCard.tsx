import { useEffect, useState } from "react";
import type { HealthResponse } from "@projeto-home/contracts";
import { getHealth } from "./api.js";

type StatusState =
  | { state: "loading" }
  | { state: "online"; health: HealthResponse }
  | { state: "offline" };

export function ServerStatusCard() {
  const [status, setStatus] = useState<StatusState>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal)
      .then((health) => setStatus({ state: "online", health }))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setStatus({ state: "offline" });
        }
      });

    return () => controller.abort();
  }, []);

  if (status.state === "loading") {
    return <section className="status-card status-card--loading">Carregando estado…</section>;
  }

  if (status.state === "offline") {
    return (
      <section className="status-card status-card--offline" role="alert">
        <span className="status-dot" aria-hidden="true" />
        <div>
          <strong>Servidor indisponível</strong>
          <p>Não foi possível consultar o núcleo local.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="status-card status-card--online" aria-label="Estado do servidor">
      <span className="status-dot" aria-hidden="true" />
      <div>
        <strong>Servidor online</strong>
        <p>
          API {status.health.version} · banco {status.health.database}
        </p>
      </div>
    </section>
  );
}
