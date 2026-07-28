import { describe, expect, it } from "vitest";
import { HealthResponseSchema } from "../src/index.js";

describe("HealthResponseSchema", () => {
  it("accepts the public health contract", () => {
    const result = HealthResponseSchema.safeParse({
      status: "ok",
      version: "0.1.0",
      uptimeSeconds: 12.5,
      database: "ok",
      timestamp: "2026-07-28T06:00:00.000Z",
      requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
    });

    expect(result.success).toBe(true);
  });

  it("rejects malformed health data", () => {
    expect(
      HealthResponseSchema.safeParse({ status: "ok", requestId: "invalid" })
        .success,
    ).toBe(false);
  });
});
