import { describe, expect, it } from "vitest";
import {
  ListPersistedEventsQuerySchema,
  ListPersistedEventsResponseSchema,
} from "../src/index.js";

describe("persisted event contracts", () => {
  it("parses validated filters and applies the page default", () => {
    const query = ListPersistedEventsQuerySchema.parse({
      kind: "error",
      from: "2026-07-28T00:00:00.000Z",
      service: "http",
    });

    expect(query).toMatchObject({ kind: "error", service: "http", limit: 50 });
  });

  it("rejects incompatible filters and invalid time ranges", () => {
    expect(
      ListPersistedEventsQuerySchema.safeParse({
        kind: "audit",
        service: "http",
      }).success,
    ).toBe(false);
    expect(
      ListPersistedEventsQuerySchema.safeParse({
        from: "2026-07-29T00:00:00.000Z",
        to: "2026-07-28T00:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("accepts a discriminated event page", () => {
    expect(
      ListPersistedEventsResponseSchema.safeParse({
        items: [
          {
            kind: "error",
            id: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
            timestamp: "2026-07-28T00:00:00.000Z",
            service: "http",
            action: "http.request",
          },
        ],
      }).success,
    ).toBe(true);
  });
});
