import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { jobAttempts, webhookJobs } from "../src/schema.js";
import { createTestDatabase } from "./helpers.js";

const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

describe("Drizzle with node:sqlite", () => {
  it("applies the required pragmas and performs typed CRUD", () => {
    const database = createTestDatabase("smoke");
    cleanups.push(database.cleanup);

    expect(database.sqlite.prepare("PRAGMA journal_mode").get()).toMatchObject({
      journal_mode: "wal",
    });
    expect(database.sqlite.prepare("PRAGMA foreign_keys").get()).toMatchObject({
      foreign_keys: 1,
    });
    expect(database.sqlite.prepare("PRAGMA busy_timeout").get()).toMatchObject({
      timeout: 5000,
    });

    database.db
      .insert(webhookJobs)
      .values({
        id: "job-1",
        source: "smoke",
        payload: JSON.stringify({ ok: true }),
        createdAt: new Date(0),
      })
      .run();

    const job = database.db
      .select()
      .from(webhookJobs)
      .where(eq(webhookJobs.id, "job-1"))
      .get();

    expect(job).toMatchObject({ id: "job-1", source: "smoke", status: "pending" });
    expect(job?.createdAt).toEqual(new Date(0));
  });

  it("enforces foreign keys and rolls transactions back", () => {
    const database = createTestDatabase("transactions");
    cleanups.push(database.cleanup);

    expect(() =>
      database.db
        .insert(jobAttempts)
        .values({ jobId: "missing", outcome: "failure", createdAt: new Date() })
        .run(),
    ).toThrow();

    expect(() =>
      database.db.transaction((transaction) => {
        transaction
          .insert(webhookJobs)
          .values({
            id: "rolled-back",
            source: "transaction",
            payload: "{}",
            createdAt: new Date(),
          })
          .run();
        throw new Error("force rollback");
      }),
    ).toThrow("force rollback");

    expect(
      database.db
        .select()
        .from(webhookJobs)
        .where(eq(webhookJobs.id, "rolled-back"))
        .get(),
    ).toBeUndefined();
  });
});
