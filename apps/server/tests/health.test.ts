import {
  ErrorResponseSchema,
  HealthResponseSchema,
} from "@projeto-home/contracts";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { OperationalLogInput } from "../src/logging/operational-logger.js";
import { createTestDatabase, createTestWebDist } from "./helpers.js";

const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

describe("GET /health", () => {
  it("returns a validated health response and request id", async () => {
    const testDatabase = createTestDatabase("health");
    cleanups.push(testDatabase.cleanup);
    const events: OperationalLogInput[] = [];
    const app = createApp({
      database: testDatabase.database,
      version: "0.1.0-test",
      now: () => new Date("2026-07-28T06:00:00.000Z"),
      uptime: () => 42,
      logger: { log: (event) => events.push(event) },
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
    expect(events).toContainEqual(
      expect.objectContaining({
        action: "http.request",
        outcome: "success",
        requestId: payload.requestId,
      }),
    );
  });

  it("returns the safe error envelope for an unknown route", async () => {
    const testDatabase = createTestDatabase("not-found");
    cleanups.push(testDatabase.cleanup);
    const app = createApp({ database: testDatabase.database, version: "test" });

    const response = await request(app).get("/missing").expect(404);
    expect(ErrorResponseSchema.parse(response.body).error.code).toBe("not_found");
  });

  it("correlates a failed request with its error and final events", async () => {
    const testDatabase = createTestDatabase("unavailable");
    cleanups.push(testDatabase.cleanup);
    testDatabase.database.isHealthy = () => false;
    const events: OperationalLogInput[] = [];
    const app = createApp({
      database: testDatabase.database,
      version: "test",
      logger: { log: (event) => events.push(event) },
    });

    const response = await request(app).get("/health").expect(500);
    const requestId = ErrorResponseSchema.parse(response.body).error.requestId;

    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "http.request.error",
          requestId,
          outcome: "failure",
        }),
        expect.objectContaining({
          action: "http.request",
          requestId,
          outcome: "failure",
        }),
      ]),
    );
  });

  it("serves the compiled frontend when it is available", async () => {
    const testDatabase = createTestDatabase("static-web");
    const testWebDist = createTestWebDist();
    cleanups.push(testDatabase.cleanup, testWebDist.cleanup);
    const app = createApp({
      database: testDatabase.database,
      version: "test",
      webDistPath: testWebDist.directory,
    });

    const response = await request(app).get("/").expect(200);
    expect(response.headers["content-type"]).toMatch(/text\/html/);
    expect(response.text).toContain("Projeto Home estático");
  });
});
