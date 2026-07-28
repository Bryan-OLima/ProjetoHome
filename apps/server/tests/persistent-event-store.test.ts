import { OperationalLogEventSchema } from "@projeto-home/contracts";
import { eq } from "drizzle-orm";
import { Worker } from "node:worker_threads";
import { afterEach, describe, expect, it } from "vitest";
import { auditEvents, errorEvents } from "../src/db/schema.js";
import { PersistentEventStore } from "../src/observability/persistent-event-store.js";
import { createTestDatabase } from "./helpers.js";

const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

describe("PersistentEventStore", () => {
  it("applies the migration and stores only sanitized audit metadata", () => {
    const testDatabase = createTestDatabase("audit");
    cleanups.push(testDatabase.cleanup);
    const store = new PersistentEventStore(
      testDatabase.database,
      () => new Date("2026-07-28T12:00:00.000Z"),
    );

    const id = store.recordAudit({
      actor: "local.admin",
      action: "settings.update",
      resourceType: "settings",
      resourceId: "password=hunter2",
      permission: "settings.write",
      outcome: "success",
      requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
      context: {
        token: "private-token",
        changedFields: ["theme"],
      },
    });

    const stored = testDatabase.database.db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.id, id))
      .get();
    expect(stored).toMatchObject({
      actor: "local.admin",
      action: "settings.update",
      resourceType: "settings",
      resourceId: "password=[REDACTED]",
      permission: "settings.write",
      outcome: "success",
      requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
      timestamp: new Date("2026-07-28T12:00:00.000Z"),
    });
    expect(stored?.context).not.toContain("private-token");
    expect(stored?.context).toContain("[REDACTED]");
  });

  it("persists only error-level operational events", () => {
    const testDatabase = createTestDatabase("errors");
    cleanups.push(testDatabase.cleanup);
    const store = new PersistentEventStore(testDatabase.database);
    const baseEvent = {
      timestamp: "2026-07-28T12:00:00.000Z",
      service: "http",
      action: "http.request",
      outcome: "failure",
      requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
      errorCode: "internal_error",
      message: "token=private-value",
      context: { cookie: "session=private" },
    } as const;

    expect(
      store.recordError(
        OperationalLogEventSchema.parse({ ...baseEvent, level: "warn" }),
      ),
    ).toBeUndefined();
    const id = store.recordError(
      OperationalLogEventSchema.parse({ ...baseEvent, level: "error" }),
    );

    const rows = testDatabase.database.db.select().from(errorEvents).all();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id,
      service: "http",
      action: "http.request",
      errorCode: "internal_error",
      requestId: baseEvent.requestId,
      message: "token=[REDACTED]",
    });
    expect(rows[0]?.context).not.toContain("session=private");
  });

  it("waits for a short competing write and preserves the audit event", async () => {
    const testDatabase = createTestDatabase("audit-contention");
    cleanups.push(testDatabase.cleanup);
    const eventId = "6d55053d-22a8-48af-b40e-c6fccb09210c";
    testDatabase.database.sqlite.exec("BEGIN IMMEDIATE;");

    const inserted = new Promise<void>((resolve, reject) => {
      const worker = new Worker(new URL("./audit-writer.mjs", import.meta.url), {
        workerData: { databasePath: testDatabase.database.path, id: eventId },
      });
      worker.on("message", (message: { type: string }) => {
        if (message.type === "ready") {
          setTimeout(() => testDatabase.database.sqlite.exec("COMMIT;"), 50);
        }
        if (message.type === "inserted") resolve();
      });
      worker.once("error", reject);
      worker.once("exit", (code) => {
        if (code !== 0) reject(new Error(`Audit writer exited with code ${code}`));
      });
    });

    await inserted;
    expect(
      testDatabase.database.db
        .select({ id: auditEvents.id })
        .from(auditEvents)
        .where(eq(auditEvents.id, eventId))
        .get(),
    ).toEqual({ id: eventId });
  });
});
