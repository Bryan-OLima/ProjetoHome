import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export const requestContext: RequestHandler = (_request, response, next) => {
  const requestId = randomUUID();
  response.locals.requestId = requestId;
  response.setHeader("x-request-id", requestId);
  next();
};

export function getRequestId(locals: Record<string, unknown>): string {
  return typeof locals.requestId === "string" ? locals.requestId : randomUUID();
}
