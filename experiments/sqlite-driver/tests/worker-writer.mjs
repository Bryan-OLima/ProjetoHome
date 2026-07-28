import { DatabaseSync } from "node:sqlite";
import { parentPort, workerData } from "node:worker_threads";

const database = new DatabaseSync(workerData.databasePath);
database.exec("PRAGMA journal_mode = WAL;");
database.exec("PRAGMA busy_timeout = 5000;");
database.exec("PRAGMA synchronous = NORMAL;");

const insert = database.prepare(`
  INSERT INTO webhook_jobs (id, source, status, payload, created_at)
  VALUES (?, ?, 'pending', '{}', ?)
`);

let inserted = 0;
for (let index = 0; index < workerData.writes; index += 1) {
  insert.run(
    `worker-${workerData.workerId}-${index}`,
    `worker-${workerData.workerId}`,
    Date.now(),
  );
  inserted += 1;
}

database.close();
parentPort.postMessage({ inserted });
