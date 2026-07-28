import type { OperationalLogEvent } from "@projeto-home/contracts";
import type {
  AuditEventEntity,
  PersistedEventEntity,
} from "./entities.js";

export interface EventCursor {
  timestamp: Date;
  id: string;
}

export interface PersistedEventFilters {
  kind?: "audit" | "error";
  from?: Date;
  to?: Date;
  service?: string;
  action?: string;
  correlationId?: string;
  cursor?: EventCursor;
  limit: number;
}

export interface PersistedEventPage {
  items: PersistedEventEntity[];
  hasMore: boolean;
}

export interface RetentionPolicy {
  auditBefore: Date;
  errorBefore: Date;
  batchSize: number;
}

export interface RetentionResult {
  auditEventsDeleted: number;
  errorEventsDeleted: number;
}

export interface AuditEventWriter {
  recordAudit(event: Omit<AuditEventEntity, "id" | "timestamp" | "kind">): string;
}

export interface ErrorEventWriter {
  recordError(event: OperationalLogEvent): string | undefined;
}

export interface PersistedEventRepository {
  listEvents(filters: PersistedEventFilters): PersistedEventPage;
  pruneExpired(policy: RetentionPolicy): RetentionResult;
}
