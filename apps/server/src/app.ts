import {
  ErrorResponseSchema,
  HealthResponseSchema,
} from "@projeto-home/contracts";
import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseHandle } from "./db/database.js";
import { DrizzleEventRepository } from "./observability/drizzle-event-repository.js";
import type { PersistedEventRepository } from "./observability/event-repository.js";
import { createListPersistedEvents } from "./observability/list-persisted-events.js";
import { createListOperationalLogs } from "./observability/list-operational-logs.js";
import { JsonlOperationalLogReader } from "./observability/jsonl-operational-log-reader.js";
import type { OperationalLogReader } from "./observability/operational-log-reader.js";
import { createObservabilityRouter } from "./observability/routes.js";
import { HttpError } from "./http-error.js";
import {
  noopOperationalLogger,
  type OperationalLogger,
} from "./logging/operational-logger.js";
import { getRequestId, requestContext } from "./request-context.js";

export interface AppOptions {
  database: DatabaseHandle;
  version: string;
  webDistPath?: string;
  now?: () => Date;
  uptime?: () => number;
  logger?: OperationalLogger;
  eventRepository?: PersistedEventRepository;
  operationalLogReader?: OperationalLogReader;
}

export function createApp(options: AppOptions) {
  const app = express();
  const now = options.now ?? (() => new Date());
  const uptime = options.uptime ?? (() => process.uptime());
  const logger = options.logger ?? noopOperationalLogger;
  const eventRepository =
    options.eventRepository ?? new DrizzleEventRepository(options.database);
  const operationalLogReader =
    options.operationalLogReader ??
    new JsonlOperationalLogReader({
      directory: "./var/log",
      maxFiles: 7,
      maxScanBytes: 2 * 1024 * 1024,
    });
  const observabilityRouter = createObservabilityRouter({
    listPersistedEvents: createListPersistedEvents({ repository: eventRepository }),
    listOperationalLogs: createListOperationalLogs({ reader: operationalLogReader }),
  });

  app.disable("x-powered-by");
  app.use(requestContext);
  app.use((_request, response, next) => {
    const startedAt = process.hrtime.bigint();
    response.once("finish", () => {
      const statusCode = response.statusCode;
      logger.log({
        level: statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info",
        service: "http",
        action: "http.request",
        outcome: statusCode >= 400 ? "failure" : "success",
        requestId: getRequestId(response.locals),
        durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
        context: { statusCode },
      });
    });
    next();
  });
  app.use(express.json({ limit: "32kb" }));

  app.get("/health", (_request, response) => {
    if (!options.database.isHealthy()) {
      throw new Error("database_unavailable");
    }

    const payload = HealthResponseSchema.parse({
      status: "ok",
      version: options.version,
      uptimeSeconds: uptime(),
      database: "ok",
      timestamp: now().toISOString(),
      requestId: getRequestId(response.locals),
    });

    response.status(200).json(payload);
  });

  app.use("/api/observability", observabilityRouter);

  if (options.webDistPath && existsSync(options.webDistPath)) {
    app.use(express.static(options.webDistPath));
    app.get("/logs", (_request, response) => {
      response.sendFile(join(options.webDistPath!, "index.html"));
    });
  }

  const notFound: RequestHandler = (_request, response) => {
    const payload = ErrorResponseSchema.parse({
      error: {
        code: "not_found",
        message: "Resource not found.",
        requestId: getRequestId(response.locals),
      },
    });
    response.status(404).json(payload);
  };
  app.use(notFound);

  const errorHandler: ErrorRequestHandler = (
    error,
    _request,
    response,
    _next,
  ) => {
    const httpError = error instanceof HttpError ? error : undefined;
    const statusCode = httpError?.statusCode ?? 500;
    const errorCode = httpError?.code ?? "internal_error";
    const message = httpError?.message ?? "An unexpected error occurred.";
    logger.log({
      level: statusCode >= 500 ? "error" : "warn",
      service: "http",
      action: "http.request.error",
      outcome: "failure",
      requestId: getRequestId(response.locals),
      errorCode,
      message,
    });
    const payload = ErrorResponseSchema.parse({
      error: {
        code: errorCode,
        message,
        requestId: getRequestId(response.locals),
      },
    });
    response.status(statusCode).json(payload);
  };
  app.use(errorHandler);

  return app;
}
