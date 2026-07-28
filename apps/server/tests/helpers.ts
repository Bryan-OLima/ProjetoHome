import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openDatabase } from "../src/db/database.js";

export function createTestDatabase(prefix: string) {
  const directory = mkdtempSync(join(tmpdir(), `projeto-home-${prefix}-`));
  const database = openDatabase(join(directory, "test.sqlite"));

  return {
    database,
    cleanup() {
      database.close();
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
