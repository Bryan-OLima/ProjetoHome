import { Worker } from "node:worker_threads";
import { count } from "drizzle-orm";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { createWebhookApp } from "../src/webhook-app.js";
import { webhookJobs } from "../src/schema.js";
import { createTestDatabase } from "./helpers.js";

const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

function runWriterWorker(databasePath: string, workerId: number, writes: number) {
  return new Promise<number>((resolve, reject) => {
    const worker = new Worker(new URL("./worker-writer.mjs", import.meta.url), {
      workerData: { databasePath, workerId, writes },
    });
    worker.once("message", (message) => resolve(Number(message.inserted)));
    worker.once("error", reject);
    worker.once("exit", (code) => {
      if (code !== 0) reject(new Error(`Writer worker exited with code ${code}`));
    });
  });
}

describe("SQLite concurrency", () => {
  it("persists a burst of simultaneous webhook requests without loss", async () => {
    const database = createTestDatabase("webhooks");
    cleanups.push(database.cleanup);
    const app = createWebhookApp(database);

    const responses = await Promise.all(
      Array.from({ length: 50 }, (_, index) =>
        request(app).post("/webhooks/test-source").send({ sequence: index }),
      ),
    );

    expect(responses.every((response) => response.status === 202)).toBe(true);
    const result = database.db.select({ value: count() }).from(webhookJobs).get();
    expect(result?.value).toBe(50);
  });

  it("serializes writers from multiple connections in WAL mode", async () => {
    const database = createTestDatabase("workers");
    cleanups.push(database.cleanup);

    const inserted = await Promise.all(
      Array.from({ length: 4 }, (_, workerId) =>
        runWriterWorker(database.path, workerId, 25),
      ),
    );

    expect(inserted).toEqual([25, 25, 25, 25]);
    const result = database.db.select({ value: count() }).from(webhookJobs).get();
    expect(result?.value).toBe(100);
  });
});
