import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { migrate } from "drizzle-orm/node-sqlite/migrator";
import { openDatabase } from "../src/database.js";

export function createTestDatabase(prefix: string) {
  const directory = mkdtempSync(join(tmpdir(), `projeto-home-${prefix}-`));
  const database = openDatabase(join(directory, "test.sqlite"));
  migrate(database.db, { migrationsFolder: resolve("./drizzle") });

  return {
    ...database,
    directory,
    cleanup() {
      database.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
