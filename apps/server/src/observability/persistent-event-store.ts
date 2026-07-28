import {
  AuditEventSchema,
  OperationalLogEventSchema,
  type AuditEvent,
  type OperationalLogEvent,
} from "@projeto-home/contracts";
import { randomUUID } from "node:crypto";
import type { DatabaseHandle } from "../db/database.js";
import { auditEvents, errorEvents } from "../db/schema.js";
import { sanitizeLogData } from "../logging/sanitize.js";

export interface AuditEventInput {
  actor: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  permission?: string;
  outcome: "success" | "failure";
  requestId?: string;
  correlationId?: string;
  context?: Record<string, unknown>;
}

export class PersistentEventStore {
  constructor(
    private readonly database: DatabaseHandle,
    private readonly now: () => Date = () => new Date(),
  ) {}

  recordAudit(input: AuditEventInput): string {
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
}

function serializeContext(context: AuditEvent["context"]): string | undefined {
  return context === undefined ? undefined : JSON.stringify(context);
}
