import { describe, expect, it } from "vitest";
import { OperationalLogEventSchema } from "../src/index.js";

describe("OperationalLogEventSchema", () => {
  it("accepts a complete structured operational event", () => {
    const result = OperationalLogEventSchema.safeParse({
      timestamp: "2026-07-28T12:00:00.000Z",
      level: "info",
      service: "http",
      action: "http.request",
      outcome: "success",
      requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
      correlationId: "4bc46d80-f450-4818-9382-e75156763533",
      durationMs: 12.4,
      context: { method: "GET", statusCode: 200 },
    });

    expect(result.success).toBe(true);
  });

  it("rejects unknown levels and unstructured identifiers", () => {
    expect(
      OperationalLogEventSchema.safeParse({
        timestamp: "invalid",
        level: "verbose",
        service: "HTTP server",
        action: "request",
        outcome: "success",
      }).success,
    ).toBe(false);
  });
});
