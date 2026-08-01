import {
  ErrorResponseSchema,
  HealthResponseSchema,
  ListOperationalLogsResponseSchema,
  ListPersistedEventsResponseSchema,
  OperationalLogEventSchema,
  SystemMetricsResponseSchema,
  StorageSummaryResponseSchema,
} from "@projeto-home/contracts";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createSystemMetricsCollector } from "../src/monitoring/system-metrics.js";
import type { OperationalLogInput } from "../src/logging/operational-logger.js";
import { DrizzleEventRepository } from "../src/observability/drizzle-event-repository.js";
import type { OperationalLogReader } from "../src/observability/operational-log-reader.js";
import type { SystemMetricsCollector } from "../src/monitoring/system-metrics.js";
import type { StorageService } from "../src/storage/storage-service.js";
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

  it("returns validated persisted events with typed query filters", async () => {
    const testDatabase = createTestDatabase("event-route");
    cleanups.push(testDatabase.cleanup);
    const repository = new DrizzleEventRepository(testDatabase.database);
    repository.recordError(
      OperationalLogEventSchema.parse({
        timestamp: "2026-07-28T12:00:00.000Z",
        level: "error",
        service: "http",
        action: "http.request",
        outcome: "failure",
        errorCode: "internal_error",
      }),
    );
    const app = createApp({
      database: testDatabase.database,
      version: "test",
      eventRepository: repository,
    });

    const response = await request(app)
      .get("/api/observability/events?kind=error&service=http&limit=1")
      .expect(200);
    const payload = ListPersistedEventsResponseSchema.parse(response.body);

    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).toMatchObject({
      kind: "error",
      service: "http",
      action: "http.request",
    });
    expect(response.headers["x-request-id"]).toMatch(
      /^[0-9a-f-]{36}$/i,
    );
  });

  it("returns available and unavailable system metrics without failing the response", async () => {
    const testDatabase = createTestDatabase("metrics-route");
    cleanups.push(testDatabase.cleanup);
    const collector: SystemMetricsCollector = {
      async collect() {
        return {
          collectedAt: "2026-07-28T12:00:00.000Z",
          serverUptimeSeconds: 42,
          memory: {
            totalBytes: { status: "available", value: 5_763_300_000 },
            availableBytes: { status: "available", value: 2_183_204_000 },
          },
          swap: {
            totalBytes: { status: "available", value: 4_194_300_000 },
            usedBytes: { status: "unavailable" },
          },
          storage: {
            totalBytes: { status: "available", value: 112_407_516_000 },
            availableBytes: { status: "available", value: 73_663_012_000 },
          },
          temperatures: {
            cpuCelsius: { status: "available", value: 36.8 },
            batteryCelsius: { status: "unavailable" },
          },
        };
      },
    };
    const app = createApp({
      database: testDatabase.database,
      version: "test",
      systemMetricsCollector: collector,
    });

    const response = await request(app).get("/api/monitoring/metrics").expect(200);
    const payload = SystemMetricsResponseSchema.parse(response.body);
    expect(payload).toMatchObject({
      serverUptimeSeconds: 42,
      temperatures: { batteryCelsius: { status: "unavailable" } },
    });
  });

  it("returns only the configured internal storage location", async () => {
    const testDatabase = createTestDatabase("storage-route");
    cleanups.push(testDatabase.cleanup);
    const storageService: StorageService = {
      async getSummary() {
        return {
          locations: [{
            id: "internal",
            label: "Armazenamento interno",
            status: "available",
            totalBytes: { status: "available", value: 100 },
            usedBytes: { status: "available", value: 25 },
            availableBytes: { status: "available", value: 75 },
          }],
        };
      },
      async listItems() {
        return { items: [], truncated: false };
      },
    };
    const app = createApp({
      database: testDatabase.database,
      version: "test",
      storageService,
    });

    const response = await request(app).get("/api/storage/locations").expect(200);
    expect(StorageSummaryResponseSchema.parse(response.body).locations).toHaveLength(1);
  });

  it("lists only metadata from the fixed internal root", async () => {
    const testDatabase = createTestDatabase("storage-items-route");
    cleanups.push(testDatabase.cleanup);
    const storageService: StorageService = {
      async getSummary() {
        return { locations: [{ id: "internal", label: "Armazenamento interno", status: "available", totalBytes: { status: "available", value: 100 }, usedBytes: { status: "available", value: 25 }, availableBytes: { status: "available", value: 75 } }] };
      },
      async listItems(limit) {
        expect(limit).toBe(1);
        return { items: [{ name: "notes.txt", kind: "file", sizeBytes: 12, modifiedAt: "2026-08-01T12:00:00.000Z" }], truncated: false };
      },
    };
    const app = createApp({ database: testDatabase.database, version: "test", storageService });

    const response = await request(app).get("/api/storage/internal/items?limit=1").expect(200);
    expect(response.body.items[0]).toMatchObject({ name: "notes.txt", kind: "file" });
    await request(app).get("/api/storage/internal/items?path=../secret").expect(400);
  });

  it("rejects invalid persisted event filters with a safe client error", async () => {
    const testDatabase = createTestDatabase("invalid-event-query");
    cleanups.push(testDatabase.cleanup);
    const app = createApp({ database: testDatabase.database, version: "test" });

    const response = await request(app)
      .get("/api/observability/events?kind=audit&service=http")
      .expect(400);

    expect(ErrorResponseSchema.parse(response.body).error).toMatchObject({
      code: "invalid_request",
      message: "Request parameters are invalid.",
    });
  });

  it("rejects a malformed persisted event cursor with a safe client error", async () => {
    const testDatabase = createTestDatabase("invalid-event-cursor");
    cleanups.push(testDatabase.cleanup);
    const app = createApp({ database: testDatabase.database, version: "test" });

    const response = await request(app)
      .get("/api/observability/events?cursor=not-a-cursor")
      .expect(400);

    expect(ErrorResponseSchema.parse(response.body).error.code).toBe(
      "invalid_request",
    );
  });

  it("returns validated operational logs with typed query filters", async () => {
    const testDatabase = createTestDatabase("operational-log-route");
    cleanups.push(testDatabase.cleanup);
    const reader: OperationalLogReader = {
      listLogs(filters) {
        expect(filters).toMatchObject({ level: "warn", limit: 1 });
        return {
          items: [
            OperationalLogEventSchema.parse({
              timestamp: "2026-07-28T12:00:00.000Z",
              level: "warn",
              service: "http",
              action: "http.request",
              outcome: "failure",
            }),
          ],
          truncated: false,
        };
      },
    };
    const app = createApp({
      database: testDatabase.database,
      version: "test",
      operationalLogReader: reader,
    });

    const response = await request(app)
      .get("/api/observability/operational-logs?level=warn&limit=1")
      .expect(200);
    const payload = ListOperationalLogsResponseSchema.parse(response.body);

    expect(payload).toMatchObject({
      truncated: false,
      items: [expect.objectContaining({ level: "warn" })],
    });
  });

  it("rejects invalid operational log filters with a safe client error", async () => {
    const testDatabase = createTestDatabase("invalid-operational-log-query");
    cleanups.push(testDatabase.cleanup);
    const app = createApp({ database: testDatabase.database, version: "test" });

    const response = await request(app)
      .get("/api/observability/operational-logs?limit=101")
      .expect(400);

    expect(ErrorResponseSchema.parse(response.body).error.code).toBe(
      "invalid_request",
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

  it("serves the frontend entry point for the logs page", async () => {
    const testDatabase = createTestDatabase("static-logs");
    const testWebDist = createTestWebDist();
    cleanups.push(testDatabase.cleanup, testWebDist.cleanup);
    const app = createApp({
      database: testDatabase.database,
      version: "test",
      webDistPath: testWebDist.directory,
    });

    const response = await request(app).get("/logs").expect(200);
    expect(response.headers["content-type"]).toMatch(/text\/html/);
    expect(response.text).toContain("Projeto Home estático");
  });
});

describe("system metrics collector", () => {
  it("returns a payload that satisfies the public contract", async () => {
    const collector = createSystemMetricsCollector({
      now: () => new Date("2026-07-28T12:00:00.000Z"),
      uptime: () => 42,
    });

    const payload = await collector.collect();

    expect(SystemMetricsResponseSchema.parse(payload)).toEqual(payload);
  });
});
