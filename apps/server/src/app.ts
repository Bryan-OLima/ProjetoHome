import {
  ErrorResponseSchema,
  HealthResponseSchema,
} from "@projeto-home/contracts";
import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";
import { existsSync } from "node:fs";
import type { DatabaseHandle } from "./db/database.js";
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
}

export function createApp(options: AppOptions) {
  const app = express();
  const now = options.now ?? (() => new Date());
  const uptime = options.uptime ?? (() => process.uptime());
  const logger = options.logger ?? noopOperationalLogger;

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

  if (options.webDistPath && existsSync(options.webDistPath)) {
    app.use(express.static(options.webDistPath));
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
    _error,
    _request,
    response,
    _next,
  ) => {
    logger.log({
      level: "error",
      service: "http",
      action: "http.request.error",
      outcome: "failure",
      requestId: getRequestId(response.locals),
      errorCode: "internal_error",
      message: "Request processing failed.",
    });
    const payload = ErrorResponseSchema.parse({
      error: {
        code: "internal_error",
        message: "An unexpected error occurred.",
        requestId: getRequestId(response.locals),
      },
    });
    response.status(500).json(payload);
  };
  app.use(errorHandler);

  return app;
}
