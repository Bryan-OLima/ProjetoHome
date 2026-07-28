import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync(process.argv[2]);
database.exec("PRAGMA journal_mode = WAL;");
database.exec("PRAGMA busy_timeout = 5000;");
database.exec("BEGIN IMMEDIATE;");
database
  .prepare(`
    INSERT INTO webhook_jobs (id, source, status, payload, created_at)
    VALUES ('interrupted', 'crash-test', 'pending', '{}', ?)
  `)
  .run(Date.now());

process.exit(37);
