import {
  ListOperationalLogsQuerySchema,
  ListOperationalLogsResponseSchema,
  ListPersistedEventsQuerySchema,
  ListPersistedEventsResponseSchema,
  type ListOperationalLogsQueryInput,
  type ListOperationalLogsResponse,
  type ListPersistedEventsQueryInput,
  type ListPersistedEventsResponse,
} from "@projeto-home/contracts";
import { Router, type Request, type Response } from "express";
import { HttpError } from "../http-error.js";
import {
  InvalidEventCursorError,
  type ListPersistedEvents,
} from "./list-persisted-events.js";
import type { ListOperationalLogs } from "./list-operational-logs.js";

export type NoRouteParams = Record<string, never>;
export type NoRequestBody = never;
export interface AppLocals extends Record<string, unknown> {
  requestId: string;
}

type ListEventsRequest = Request<
  NoRouteParams,
  ListPersistedEventsResponse,
  NoRequestBody,
  ListPersistedEventsQueryInput,
  AppLocals
>;
type ListEventsResponse = Response<ListPersistedEventsResponse, AppLocals>;
type ListOperationalLogsRequest = Request<
  NoRouteParams,
  ListOperationalLogsResponse,
  NoRequestBody,
  ListOperationalLogsQueryInput,
  AppLocals
>;
type ListOperationalLogsResponseType = Response<
  ListOperationalLogsResponse,
  AppLocals
>;

export function createObservabilityRouter(dependencies: {
  listPersistedEvents: ListPersistedEvents;
  listOperationalLogs: ListOperationalLogs;
}) {
  const router = Router();

  router.get<
    NoRouteParams,
    ListPersistedEventsResponse,
    NoRequestBody,
    ListPersistedEventsQueryInput,
    AppLocals
  >("/events", (request: ListEventsRequest, response: ListEventsResponse) => {
    const parsedQuery = ListPersistedEventsQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      throw new HttpError(
        400,
        "invalid_request",
        "Request parameters are invalid.",
      );
    }

    try {
      const payload = ListPersistedEventsResponseSchema.parse(
        dependencies.listPersistedEvents.execute(parsedQuery.data),
      );
      response.status(200).json(payload);
    } catch (error) {
      if (error instanceof InvalidEventCursorError) {
        throw new HttpError(
          400,
          "invalid_request",
          "Request parameters are invalid.",
        );
      }
      throw error;
    }
  });

  router.get<
    NoRouteParams,
    ListOperationalLogsResponse,
    NoRequestBody,
    ListOperationalLogsQueryInput,
    AppLocals
  >(
    "/operational-logs",
    (
      request: ListOperationalLogsRequest,
      response: ListOperationalLogsResponseType,
    ) => {
      const parsedQuery = ListOperationalLogsQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        throw new HttpError(
          400,
          "invalid_request",
          "Request parameters are invalid.",
        );
      }

      const payload = ListOperationalLogsResponseSchema.parse(
        dependencies.listOperationalLogs.execute(parsedQuery.data),
      );
      response.status(200).json(payload);
    },
  );

  return router;
}
