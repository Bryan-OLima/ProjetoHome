import {
  HealthResponseSchema,
  type HealthResponse,
} from "@projeto-home/contracts";

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch("/health", signal ? { signal } : undefined);
  if (!response.ok) {
    throw new Error(`health_request_failed:${response.status}`);
  }

  return HealthResponseSchema.parse(await response.json());
}
