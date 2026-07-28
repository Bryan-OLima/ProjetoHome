import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/node-sqlite";

export type DatabaseHandle = ReturnType<typeof openDatabase>;

export function openDatabase(databasePath: string) {
  const absolutePath = resolve(databasePath);
  mkdirSync(dirname(absolutePath), { recursive: true });

  const sqlite = new DatabaseSync(absolutePath);
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  sqlite.exec("PRAGMA busy_timeout = 5000;");
  sqlite.exec("PRAGMA synchronous = NORMAL;");

  const db = drizzle({ client: sqlite });

  return {
    db,
    sqlite,
    path: absolutePath,
    isHealthy() {
      return sqlite.prepare("SELECT 1 AS healthy").get()?.healthy === 1;
    },
    close() {
      sqlite.close();
    },
  };
}
