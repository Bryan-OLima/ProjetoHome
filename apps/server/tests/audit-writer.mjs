import { parentPort, workerData } from "node:worker_threads";
import { DatabaseSync } from "node:sqlite";

const database = new DatabaseSync(workerData.databasePath);
database.exec("PRAGMA journal_mode=WAL;");
database.exec("PRAGMA foreign_keys=ON;");
database.exec("PRAGMA busy_timeout=5000;");
database.exec("PRAGMA synchronous=NORMAL;");

parentPort.postMessage({ type: "ready" });

try {
  database
    .prepare(
      `INSERT INTO audit_events (
        id, timestamp, actor, action, resource_type, outcome
      ) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      workerData.id,
      Date.now(),
      "test.worker",
      "test.concurrent_write",
      "test_resource",
      "success",
    );
  parentPort.postMessage({ type: "inserted" });
} finally {
  database.close();
}
