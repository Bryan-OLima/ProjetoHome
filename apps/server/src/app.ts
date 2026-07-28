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
import { getRequestId, requestContext } from "./request-context.js";

export interface AppOptions {
  database: DatabaseHandle;
  version: string;
  webDistPath?: string;
  now?: () => Date;
  uptime?: () => number;
}

export function createApp(options: AppOptions) {
  const app = express();
  const now = options.now ?? (() => new Date());
  const uptime = options.uptime ?? (() => process.uptime());

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  app.use(requestContext);

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
