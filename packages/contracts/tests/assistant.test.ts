import { describe, expect, it } from "vitest";
import {
  AssistantQueryRequestSchema,
  AssistantQueryResponseSchema,
} from "../src/index.js";

describe("assistant contracts", () => {
  it("accepts a validated tool result without the original query", () => {
    const result = AssistantQueryResponseSchema.safeParse({
      kind: "tool_result",
      message: "Métricas atuais do servidor consultadas.",
      tool: "system.get_metrics",
      data: {
        collectedAt: "2026-08-01T12:00:00.000Z",
        serverUptimeSeconds: 42,
        memory: { totalBytes: { status: "available", value: 100 }, availableBytes: { status: "available", value: 50 } },
        swap: { totalBytes: { status: "unavailable" }, usedBytes: { status: "unavailable" } },
        storage: { totalBytes: { status: "available", value: 100 }, availableBytes: { status: "available", value: 50 } },
        temperatures: { cpuCelsius: { status: "available", value: 36 }, batteryCelsius: { status: "unavailable" } },
      },
      requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
      correlationId: "b66aa9b5-3187-40c6-94e9-ca080618b1c7",
    });

    expect(result.success).toBe(true);
  });

  it("rejects blank and oversized queries", () => {
    expect(AssistantQueryRequestSchema.safeParse({ query: "  " }).success).toBe(false);
    expect(AssistantQueryRequestSchema.safeParse({ query: "x".repeat(4_097) }).success).toBe(false);
  });
});
