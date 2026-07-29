import {
  HealthResponseSchema,
  ListOperationalLogsResponseSchema,
  ListPersistedEventsResponseSchema,
  SystemMetricsResponseSchema,
  type HealthResponse,
  type ListOperationalLogsQuery,
  type ListOperationalLogsResponse,
  type ListPersistedEventsQuery,
  type ListPersistedEventsResponse,
  type SystemMetricsResponse,
} from "@projeto-home/contracts";

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch("/health", signal ? { signal } : undefined);
  if (!response.ok) {
    throw new Error(`health_request_failed:${response.status}`);
  }

  return HealthResponseSchema.parse(await response.json());
}

export async function getPersistedEvents(
  query: ListPersistedEventsQuery,
  signal?: AbortSignal,
): Promise<ListPersistedEventsResponse> {
  return getJson(
    `/api/observability/events?${toSearchParams(query).toString()}`,
    ListPersistedEventsResponseSchema,
    signal,
  );
}

export async function getOperationalLogs(
  query: ListOperationalLogsQuery,
  signal?: AbortSignal,
): Promise<ListOperationalLogsResponse> {
  return getJson(
    `/api/observability/operational-logs?${toSearchParams(query).toString()}`,
    ListOperationalLogsResponseSchema,
    signal,
  );
}

export async function getSystemMetrics(signal?: AbortSignal): Promise<SystemMetricsResponse> {
  return getJson("/api/monitoring/metrics", SystemMetricsResponseSchema, signal);
}

async function getJson<T>(
  path: string,
  schema: { parse(value: unknown): T },
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, signal ? { signal } : undefined);
  if (!response.ok) {
    throw new Error(`api_request_failed:${response.status}`);
  }

  return schema.parse(await response.json());
}

function toSearchParams(query: Record<string, string | number | undefined>) {
  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) parameters.set(key, String(value));
  }
  return parameters;
}
