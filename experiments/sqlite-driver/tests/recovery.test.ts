import { spawnSync } from "node:child_process";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "../src/database.js";
import { webhookJobs } from "../src/schema.js";
import { createTestDatabase } from "./helpers.js";

const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

describe("SQLite recovery", () => {
  it("rolls an interrupted transaction back and preserves integrity", () => {
    const initialDatabase = createTestDatabase("recovery");
    const databasePath = initialDatabase.path;
    const directory = initialDatabase.directory;
    initialDatabase.close();

    const crashWriter = fileURLToPath(new URL("./crash-writer.mjs", import.meta.url));
    const crashed = spawnSync(process.execPath, [crashWriter, databasePath], {
      encoding: "utf8",
    });
    expect(crashed.status).toBe(37);

    const recovered = openDatabase(databasePath);
    cleanups.push(() => {
      recovered.close();
      rmSync(directory, { recursive: true, force: true });
    });

    expect(
      recovered.db
        .select()
        .from(webhookJobs)
        .where(eq(webhookJobs.id, "interrupted"))
        .get(),
    ).toBeUndefined();
    expect(recovered.sqlite.prepare("PRAGMA integrity_check").get()).toMatchObject({
      integrity_check: "ok",
    });
  });
});
