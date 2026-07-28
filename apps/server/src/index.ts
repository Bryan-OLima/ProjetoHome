import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { openDatabase } from "./db/database.js";
import {
  createOperationalLogger,
  RotatingJsonlWriter,
} from "./logging/operational-logger.js";
import { PersistentEventStore } from "./observability/persistent-event-store.js";

const environmentFile = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(environmentFile)) {
  process.loadEnvFile(environmentFile);
}

const config = loadConfig();
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };
const database = openDatabase(config.databasePath);
const persistentEvents = new PersistentEventStore(database);
const logWriter = new RotatingJsonlWriter({
  directory: config.logDirectory,
  maxBytes: config.logMaxBytes,
  maxFiles: config.logMaxFiles,
});
const logger = createOperationalLogger({
  writer: logWriter,
  onWriteFailure(error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        service: "logging",
        action: "logging.write",
        outcome: "failure",
        errorCode: "log_write_failed",
        errorType: error instanceof Error ? error.name : "UnknownError",
      }),
    );
  },
  onEvent(event) {
    if (event.level === "error") persistentEvents.recordError(event);
  },
  onEventFailure(error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        service: "observability",
        action: "observability.persist",
        outcome: "failure",
        errorCode: "event_persist_failed",
        errorType: error instanceof Error ? error.name : "UnknownError",
      }),
    );
  },
});
const webDistPath = fileURLToPath(new URL("../../web/dist/", import.meta.url));
const app = createApp({
  database,
  version: packageJson.version,
  webDistPath,
  logger,
});

const server = app.listen(config.port, config.host, () => {
  logger.log({
    level: "info",
    service: "server",
    action: "server.started",
    outcome: "success",
    context: { host: config.host, port: config.port },
  });
});

function shutdown(signal: string) {
  logger.log({
    level: "info",
    service: "server",
    action: "server.stop",
    outcome: "success",
    context: { signal },
  });
  server.close(() => {
    database.close();
    process.exitCode = 0;
  });
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
