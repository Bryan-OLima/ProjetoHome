import { afterEach, describe, expect, it } from "vitest";
import { createTestDatabase } from "./helpers.js";

const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

describe("SQLite configuration", () => {
  it("enables the validated pragmas", () => {
    const { database, cleanup } = createTestDatabase("pragmas");
    cleanups.push(cleanup);

    expect(database.sqlite.prepare("PRAGMA journal_mode").get()).toMatchObject({
      journal_mode: "wal",
    });
    expect(database.sqlite.prepare("PRAGMA foreign_keys").get()).toMatchObject({
      foreign_keys: 1,
    });
    expect(database.sqlite.prepare("PRAGMA busy_timeout").get()).toMatchObject({
      timeout: 5000,
    });
    expect(database.sqlite.prepare("PRAGMA synchronous").get()).toMatchObject({
      synchronous: 1,
    });
    expect(database.isHealthy()).toBe(true);
  });
});
