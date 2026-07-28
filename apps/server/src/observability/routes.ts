import {
  ListPersistedEventsQuerySchema,
  ListPersistedEventsResponseSchema,
  type ListPersistedEventsQueryInput,
  type ListPersistedEventsResponse,
} from "@projeto-home/contracts";
import { Router, type Request, type Response } from "express";
import { HttpError } from "../http-error.js";
import {
  InvalidEventCursorError,
  type ListPersistedEvents,
} from "./list-persisted-events.js";

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

export function createObservabilityRouter(dependencies: {
  listPersistedEvents: ListPersistedEvents;
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

  return router;
}
