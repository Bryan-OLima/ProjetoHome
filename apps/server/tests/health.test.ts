import {
  ErrorResponseSchema,
  HealthResponseSchema,
} from "@projeto-home/contracts";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createTestDatabase } from "./helpers.js";

const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

describe("GET /health", () => {
  it("returns a validated health response and request id", async () => {
    const testDatabase = createTestDatabase("health");
    cleanups.push(testDatabase.cleanup);
    const app = createApp({
      database: testDatabase.database,
      version: "0.1.0-test",
      now: () => new Date("2026-07-28T06:00:00.000Z"),
      uptime: () => 42,
    });

    const response = await request(app).get("/health").expect(200);
    const payload = HealthResponseSchema.parse(response.body);

    expect(payload).toMatchObject({
      status: "ok",
      version: "0.1.0-test",
      uptimeSeconds: 42,
      database: "ok",
      timestamp: "2026-07-28T06:00:00.000Z",
    });
    expect(response.headers["x-request-id"]).toBe(payload.requestId);
  });

  it("returns the safe error envelope for an unknown route", async () => {
    const testDatabase = createTestDatabase("not-found");
    cleanups.push(testDatabase.cleanup);
    const app = createApp({ database: testDatabase.database, version: "test" });

    const response = await request(app).get("/missing").expect(404);
    expect(ErrorResponseSchema.parse(response.body).error.code).toBe("not_found");
  });
});
