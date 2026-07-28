import {
  ListPersistedEventsResponseSchema,
  type ListPersistedEventsQuery,
  type ListPersistedEventsResponse,
} from "@projeto-home/contracts";
import type { PersistedEventEntity } from "./entities.js";
import { toPersistedEventDto } from "./entities.js";
import type {
  EventCursor,
  PersistedEventFilters,
  PersistedEventRepository,
} from "./event-repository.js";

export interface ListPersistedEvents {
  execute(query: ListPersistedEventsQuery): ListPersistedEventsResponse;
}

export function createListPersistedEvents(dependencies: {
  repository: PersistedEventRepository;
}): ListPersistedEvents {
  return {
    execute(query) {
      const filters: PersistedEventFilters = { limit: query.limit };
      if (query.kind) filters.kind = query.kind;
      if (query.from) filters.from = new Date(query.from);
      if (query.to) filters.to = new Date(query.to);
      if (query.service) filters.service = query.service;
      if (query.action) filters.action = query.action;
      if (query.correlationId) filters.correlationId = query.correlationId;
      if (query.cursor) filters.cursor = decodeCursor(query.cursor);

      const page = dependencies.repository.listEvents(filters);
      const lastItem = page.items.at(-1);

      return ListPersistedEventsResponseSchema.parse({
        items: page.items.map(toPersistedEventDto),
        nextCursor:
          page.hasMore && lastItem ? encodeCursor(lastItem) : undefined,
      });
    },
  };
}

function encodeCursor(event: PersistedEventEntity): string {
  return Buffer.from(
    JSON.stringify({ timestamp: event.timestamp.toISOString(), id: event.id }),
    "utf8",
  ).toString("base64url");
}

function decodeCursor(value: string): EventCursor {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      timestamp?: unknown;
      id?: unknown;
    };
    if (typeof parsed.timestamp !== "string" || typeof parsed.id !== "string") {
      throw new Error("invalid_cursor");
    }
    const timestamp = new Date(parsed.timestamp);
    if (Number.isNaN(timestamp.getTime()) || !isUuid(parsed.id)) {
      throw new Error("invalid_cursor");
    }
    return { timestamp, id: parsed.id };
  } catch {
    throw new InvalidEventCursorError();
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export class InvalidEventCursorError extends Error {
  constructor() {
    super("invalid_event_cursor");
  }
}
