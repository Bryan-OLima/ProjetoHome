import {
  AuditEventSchema,
  OperationalLogEventSchema,
  type AuditEvent,
  type OperationalLogEvent,
} from "@projeto-home/contracts";
import { and, desc, eq, gte, inArray, lt, lte, or, type SQL } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { DatabaseHandle } from "../db/database.js";
import { auditEvents, errorEvents } from "../db/schema.js";
import { sanitizeLogData } from "../logging/sanitize.js";
import type {
  AuditEventWriter,
  ErrorEventWriter,
  PersistedEventFilters,
  PersistedEventPage,
  PersistedEventRepository,
  RetentionPolicy,
  RetentionResult,
} from "./event-repository.js";
import type {
  AuditEventEntity,
  ErrorEventEntity,
  PersistedEventEntity,
} from "./entities.js";

export class DrizzleEventRepository
  implements AuditEventWriter, ErrorEventWriter, PersistedEventRepository
{
  constructor(
    private readonly database: DatabaseHandle,
    private readonly now: () => Date = () => new Date(),
  ) {}

  recordAudit(
    input: Omit<AuditEventEntity, "id" | "timestamp" | "kind">,
  ): string {
    const event = AuditEventSchema.parse(
      sanitizeLogData({ timestamp: this.now().toISOString(), ...input }),
    );
    const id = randomUUID();

    this.database.db
      .insert(auditEvents)
      .values({
        id,
        timestamp: new Date(event.timestamp),
        actor: event.actor,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        permission: event.permission,
        outcome: event.outcome,
        requestId: event.requestId,
        correlationId: event.correlationId,
        context: serializeContext(event.context),
      })
      .run();

    return id;
  }

  recordError(event: OperationalLogEvent): string | undefined {
    const sanitizedEvent = OperationalLogEventSchema.parse(sanitizeLogData(event));
    if (sanitizedEvent.level !== "error") return undefined;

    const id = randomUUID();
    this.database.db
      .insert(errorEvents)
      .values({
        id,
        timestamp: new Date(sanitizedEvent.timestamp),
        service: sanitizedEvent.service,
        action: sanitizedEvent.action,
        errorCode: sanitizedEvent.errorCode,
        message: sanitizedEvent.message,
        requestId: sanitizedEvent.requestId,
        correlationId: sanitizedEvent.correlationId,
        durationMs:
          sanitizedEvent.durationMs === undefined
            ? undefined
            : Math.round(sanitizedEvent.durationMs),
        context: serializeContext(sanitizedEvent.context),
      })
      .run();

    return id;
  }

  listEvents(filters: PersistedEventFilters): PersistedEventPage {
    const queryLimit = filters.limit + 1;
    const items: PersistedEventEntity[] = [];

    if (filters.kind !== "error" && !filters.service) {
      const rows = this.database.db
        .select()
        .from(auditEvents)
        .where(buildAuditWhere(filters))
        .orderBy(desc(auditEvents.timestamp), desc(auditEvents.id))
        .limit(queryLimit)
        .all();
      items.push(...rows.map(toAuditEntity));
    }

    if (filters.kind !== "audit") {
      const rows = this.database.db
        .select()
        .from(errorEvents)
        .where(buildErrorWhere(filters))
        .orderBy(desc(errorEvents.timestamp), desc(errorEvents.id))
        .limit(queryLimit)
        .all();
      items.push(...rows.map(toErrorEntity));
    }

    items.sort(compareDescending);
    const hasMore = items.length > filters.limit;
    return { items: items.slice(0, filters.limit), hasMore };
  }

  pruneExpired(policy: RetentionPolicy): RetentionResult {
    return {
      auditEventsDeleted: this.pruneAuditEvents(policy),
      errorEventsDeleted: this.pruneErrorEvents(policy),
    };
  }

  private pruneAuditEvents(policy: RetentionPolicy): number {
    const ids = this.database.db
      .select({ id: auditEvents.id })
      .from(auditEvents)
      .where(lt(auditEvents.timestamp, policy.auditBefore))
      .orderBy(auditEvents.timestamp)
      .limit(policy.batchSize)
      .all()
      .map((row) => row.id);
    if (ids.length === 0) return 0;
    return Number(
      this.database.db
        .delete(auditEvents)
        .where(inArray(auditEvents.id, ids))
        .run().changes,
    );
  }

  private pruneErrorEvents(policy: RetentionPolicy): number {
    const ids = this.database.db
      .select({ id: errorEvents.id })
      .from(errorEvents)
      .where(lt(errorEvents.timestamp, policy.errorBefore))
      .orderBy(errorEvents.timestamp)
      .limit(policy.batchSize)
      .all()
      .map((row) => row.id);
    if (ids.length === 0) return 0;
    return Number(
      this.database.db
        .delete(errorEvents)
        .where(inArray(errorEvents.id, ids))
        .run().changes,
    );
  }
}

function buildAuditWhere(filters: PersistedEventFilters): SQL | undefined {
  return and(
    filters.from ? gte(auditEvents.timestamp, filters.from) : undefined,
    filters.to ? lte(auditEvents.timestamp, filters.to) : undefined,
    filters.action ? eq(auditEvents.action, filters.action) : undefined,
    filters.correlationId
      ? eq(auditEvents.correlationId, filters.correlationId)
      : undefined,
    cursorWhere(auditEvents.timestamp, auditEvents.id, filters),
  );
}

function buildErrorWhere(filters: PersistedEventFilters): SQL | undefined {
  return and(
    filters.from ? gte(errorEvents.timestamp, filters.from) : undefined,
    filters.to ? lte(errorEvents.timestamp, filters.to) : undefined,
    filters.service ? eq(errorEvents.service, filters.service) : undefined,
    filters.action ? eq(errorEvents.action, filters.action) : undefined,
    filters.correlationId
      ? eq(errorEvents.correlationId, filters.correlationId)
      : undefined,
    cursorWhere(errorEvents.timestamp, errorEvents.id, filters),
  );
}

function cursorWhere(
  timestamp: typeof auditEvents.timestamp | typeof errorEvents.timestamp,
  id: typeof auditEvents.id | typeof errorEvents.id,
  filters: PersistedEventFilters,
): SQL | undefined {
  if (!filters.cursor) return undefined;
  return or(
    lt(timestamp, filters.cursor.timestamp),
    and(eq(timestamp, filters.cursor.timestamp), lt(id, filters.cursor.id)),
  );
}

function toAuditEntity(row: typeof auditEvents.$inferSelect): AuditEventEntity {
  return {
    kind: "audit",
    id: row.id,
    timestamp: row.timestamp,
    actor: row.actor,
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId ?? undefined,
    permission: row.permission ?? undefined,
    outcome: row.outcome,
    requestId: row.requestId ?? undefined,
    correlationId: row.correlationId ?? undefined,
    context: parseContext(row.context),
  };
}

function toErrorEntity(row: typeof errorEvents.$inferSelect): ErrorEventEntity {
  return {
    kind: "error",
    id: row.id,
    timestamp: row.timestamp,
    service: row.service,
    action: row.action,
    errorCode: row.errorCode ?? undefined,
    message: row.message ?? undefined,
    requestId: row.requestId ?? undefined,
    correlationId: row.correlationId ?? undefined,
    durationMs: row.durationMs ?? undefined,
    context: parseContext(row.context),
  };
}

function parseContext(context: string | null): Record<string, unknown> | undefined {
  if (!context) return undefined;
  try {
    const sanitized = sanitizeLogData(JSON.parse(context));
    return sanitized !== null && typeof sanitized === "object" && !Array.isArray(sanitized)
      ? (sanitized as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function serializeContext(context: AuditEvent["context"]): string | undefined {
  return context === undefined ? undefined : JSON.stringify(context);
}

function compareDescending(
  left: PersistedEventEntity,
  right: PersistedEventEntity,
): number {
  const timestampDifference = right.timestamp.getTime() - left.timestamp.getTime();
  return timestampDifference !== 0 ? timestampDifference : right.id.localeCompare(left.id);
}
