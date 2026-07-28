import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

export function createTestWebDist() {
  const directory = mkdtempSync(join(tmpdir(), "projeto-home-web-"));
  writeFileSync(
    join(directory, "index.html"),
    "<!doctype html><html><body>Projeto Home estático</body></html>",
  );

  return {
    directory,
    cleanup() {
      rmSync(directory, { recursive: true, force: true });
    },
  };
}
