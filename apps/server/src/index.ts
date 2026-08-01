import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { openDatabase } from "./db/database.js";
import {
  createOperationalLogger,
  RotatingJsonlWriter,
} from "./logging/operational-logger.js";
import { applyEventRetention } from "./observability/apply-event-retention.js";
import { DrizzleEventRepository } from "./observability/drizzle-event-repository.js";
import { JsonlOperationalLogReader } from "./observability/jsonl-operational-log-reader.js";
import { createStorageService } from "./storage/storage-service.js";

const environmentFile = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(environmentFile)) {
  process.loadEnvFile(environmentFile);
}

const config = loadConfig();
const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };
const database = openDatabase(config.databasePath);
const eventRepository = new DrizzleEventRepository(database);
const logWriter = new RotatingJsonlWriter({
  directory: config.logDirectory,
  maxBytes: config.logMaxBytes,
  maxFiles: config.logMaxFiles,
});
const operationalLogReader = new JsonlOperationalLogReader({
  directory: config.logDirectory,
  maxFiles: config.logMaxFiles,
  maxScanBytes: config.operationalLogQueryMaxBytes,
});
const storageService = createStorageService({ internalRoot: config.storageRoot });
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
    if (event.level === "error") eventRepository.recordError(event);
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
try {
  const retention = applyEventRetention(eventRepository, {
    auditRetentionDays: config.auditRetentionDays,
    errorRetentionDays: config.errorRetentionDays,
    batchSize: config.eventRetentionBatchSize,
  });
  if (retention.auditEventsDeleted > 0 || retention.errorEventsDeleted > 0) {
    eventRepository.recordAudit({
      actor: "system.retention",
      action: "observability.retention",
      resourceType: "observability",
      outcome: "success",
      context: {
        auditEventsDeleted: retention.auditEventsDeleted,
        errorEventsDeleted: retention.errorEventsDeleted,
      },
    });
  }
  logger.log({
    level: "info",
    service: "observability",
    action: "observability.retention",
    outcome: "success",
    context: {
      auditEventsDeleted: retention.auditEventsDeleted,
      errorEventsDeleted: retention.errorEventsDeleted,
    },
  });
} catch (error) {
  logger.log({
    level: "error",
    service: "observability",
    action: "observability.retention",
    outcome: "failure",
    errorCode: "retention_failed",
    message: "Event retention could not be applied.",
  });
}
const webDistPath = fileURLToPath(new URL("../../web/dist/", import.meta.url));
const app = createApp({
  database,
  version: packageJson.version,
  webDistPath,
  logger,
  eventRepository,
  operationalLogReader,
  storageService,
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
