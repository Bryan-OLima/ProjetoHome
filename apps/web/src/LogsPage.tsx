import { useEffect, useState } from "react";
import type {
  ListOperationalLogsQuery,
  ListOperationalLogsResponse,
  ListPersistedEventsQuery,
  ListPersistedEventsResponse,
  OperationalLogEvent,
  PersistedEventDto,
} from "@projeto-home/contracts";
import { getOperationalLogs, getPersistedEvents } from "./api.js";

interface LogFilters {
  from: string;
  to: string;
  level: "" | OperationalLogEvent["level"];
  kind: "" | "audit" | "error";
  service: string;
  action: string;
  correlationId: string;
}

type LogsState =
  | { state: "loading" }
  | {
      state: "ready";
      persisted: ListPersistedEventsResponse;
      operational: ListOperationalLogsResponse;
    }
  | { state: "unavailable" }
  | { state: "error" };

const initialFilters: LogFilters = {
  from: "",
  to: "",
  level: "",
  kind: "",
  service: "",
  action: "",
  correlationId: "",
};

export function LogsPage() {
  const [filters, setFilters] = useState<LogFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<LogFilters>(initialFilters);
  const [logs, setLogs] = useState<LogsState>({ state: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    const persistedQuery = createPersistedQuery(appliedFilters);
    const operationalQuery = createOperationalQuery(appliedFilters);

    Promise.all([
      getPersistedEvents(persistedQuery, controller.signal),
      getOperationalLogs(operationalQuery, controller.signal),
    ])
      .then(([persisted, operational]) => {
        setLogs({ state: "ready", persisted, operational });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLogs({ state: isUnavailable(error) ? "unavailable" : "error" });
      });

    return () => controller.abort();
  }, [appliedFilters]);

  return (
    <main className="page-shell page-shell--wide">
      <header className="page-header">
        <div>
          <span className="eyebrow">Observabilidade</span>
          <h1>Logs</h1>
          <p>Atividade operacional e eventos persistidos, sempre sanitizados.</p>
        </div>
        <a className="navigation-link" href="/">
          Visão geral
        </a>
      </header>

      <LogFiltersForm
        filters={filters}
        onChange={setFilters}
        onSubmit={() => setAppliedFilters(filters)}
      />
      <LogResults state={logs} />
    </main>
  );
}

function LogFiltersForm(props: {
  filters: LogFilters;
  onChange: (filters: LogFilters) => void;
  onSubmit: () => void;
}) {
  function update(field: keyof LogFilters, value: string) {
    props.onChange({ ...props.filters, [field]: value });
  }

  return (
    <form
      className="logs-filters"
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit();
      }}
    >
      <label>
        De
        <input
          type="datetime-local"
          value={props.filters.from}
          onChange={(event) => update("from", event.target.value)}
        />
      </label>
      <label>
        Até
        <input
          type="datetime-local"
          value={props.filters.to}
          onChange={(event) => update("to", event.target.value)}
        />
      </label>
      <label>
        Nível operacional
        <select
          value={props.filters.level}
          onChange={(event) => update("level", event.target.value)}
        >
          <option value="">Todos</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
      </label>
      <label>
        Evento persistido
        <select
          value={props.filters.kind}
          onChange={(event) => update("kind", event.target.value)}
        >
          <option value="">Todos</option>
          <option value="audit">Auditoria</option>
          <option value="error">Erro</option>
        </select>
      </label>
      <label>
        Serviço
        <input value={props.filters.service} onChange={(event) => update("service", event.target.value)} />
      </label>
      <label>
        Ação
        <input value={props.filters.action} onChange={(event) => update("action", event.target.value)} />
      </label>
      <label>
        Correlação
        <input
          value={props.filters.correlationId}
          onChange={(event) => update("correlationId", event.target.value)}
        />
      </label>
      <button type="submit">Aplicar filtros</button>
    </form>
  );
}

function LogResults({ state }: { state: LogsState }) {
  if (state.state === "loading") {
    return <section className="logs-state">Carregando logs…</section>;
  }
  if (state.state === "unavailable") {
    return <section className="logs-state" role="alert">Servidor indisponível para consulta dos logs.</section>;
  }
  if (state.state === "error") {
    return <section className="logs-state" role="alert">Não foi possível carregar os logs agora.</section>;
  }

  return (
    <div className="logs-results">
      <LogSection
        title="Eventos persistidos"
        items={state.persisted.items}
        renderItem={renderPersistedEvent}
        {...(state.persisted.nextCursor
          ? { description: "Há eventos mais antigos; refine os filtros para reduzir o resultado." }
          : {})}
      />
      <LogSection
        title="Logs operacionais"
        items={state.operational.items}
        renderItem={renderOperationalLog}
        {...(state.operational.truncated
          ? { description: "Resultado limitado à janela segura de leitura." }
          : {})}
      />
    </div>
  );
}

function LogSection<T>(props: {
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  description?: string;
}) {
  return (
    <section className="log-section">
      <div className="log-section__heading">
        <h2>{props.title}</h2>
        {props.description ? <p>{props.description}</p> : null}
      </div>
      {props.items.length === 0 ? (
        <p className="logs-empty">Nenhum evento encontrado para estes filtros.</p>
      ) : (
        <ul className="log-list">{props.items.map(props.renderItem)}</ul>
      )}
    </section>
  );
}

function renderPersistedEvent(event: PersistedEventDto, index: number) {
  const summary = event.kind === "audit" ? `${event.actor} · ${event.resourceType}` : event.service;
  return (
    <LogItem
      key={`${event.kind}-${event.id}`}
      timestamp={event.timestamp}
      label={event.kind}
      action={event.action}
      summary={summary}
      index={index}
      details={[
        ["ID", event.id],
        ["Request ID", event.requestId],
        ["Correlação", event.correlationId],
        ["Permissão", event.kind === "audit" ? event.permission : undefined],
        ["Código", event.kind === "error" ? event.errorCode : undefined],
        ["Mensagem", event.kind === "error" ? event.message : undefined],
        ["Duração", event.kind === "error" && event.durationMs !== undefined ? `${event.durationMs} ms` : undefined],
        ["Contexto", event.context ? JSON.stringify(event.context) : undefined],
      ]}
    />
  );
}

function renderOperationalLog(event: OperationalLogEvent, index: number) {
  return (
    <LogItem
      key={`${event.timestamp}-${event.action}-${index}`}
      timestamp={event.timestamp}
      label={event.level}
      action={event.action}
      summary={event.service}
      index={index}
      details={[
        ["Request ID", event.requestId],
        ["Correlação", event.correlationId],
        ["Código", event.errorCode],
        ["Mensagem", event.message],
        ["Duração", event.durationMs !== undefined ? `${event.durationMs} ms` : undefined],
        ["Contexto", event.context ? JSON.stringify(event.context) : undefined],
      ]}
    />
  );
}

function LogItem(props: {
  timestamp: string;
  label: string;
  action: string;
  summary: string;
  index: number;
  details: Array<[string, string | undefined]>;
}) {
  const details = props.details.filter(
    (detail): detail is [string, string] => detail[1] !== undefined,
  );

  return (
    <li className="log-item" data-index={props.index}>
      <time dateTime={props.timestamp}>{new Date(props.timestamp).toLocaleString()}</time>
      <span className="log-item__label">{props.label}</span>
      <strong>{props.action}</strong>
      <span>{props.summary}</span>
      {details.length > 0 ? (
        <details className="log-item__details">
          <summary>Detalhes técnicos</summary>
          <dl>
            {details.map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </li>
  );
}

function createPersistedQuery(filters: LogFilters): ListPersistedEventsQuery {
  return {
    limit: 50,
    ...toSharedQuery(filters),
    ...(filters.kind ? { kind: filters.kind } : {}),
    ...(filters.service && filters.kind !== "audit"
      ? { service: filters.service }
      : {}),
  };
}

function createOperationalQuery(filters: LogFilters): ListOperationalLogsQuery {
  return {
    limit: 50,
    ...toSharedQuery(filters),
    ...(filters.service ? { service: filters.service } : {}),
    ...(filters.level ? { level: filters.level } : {}),
  };
}

function toSharedQuery(filters: LogFilters) {
  return {
    ...(filters.from ? { from: new Date(filters.from).toISOString() } : {}),
    ...(filters.to ? { to: new Date(filters.to).toISOString() } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.correlationId ? { correlationId: filters.correlationId } : {}),
  };
}

function isUnavailable(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && error.message === "Failed to fetch");
}
