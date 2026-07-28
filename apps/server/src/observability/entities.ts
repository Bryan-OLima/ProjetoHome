import type {
  AuditEventDto,
  ErrorEventDto,
  PersistedEventDto,
} from "@projeto-home/contracts";

export interface AuditEventEntity
  extends Omit<AuditEventDto, "timestamp" | "kind"> {
  kind: "audit";
  timestamp: Date;
}

export interface ErrorEventEntity
  extends Omit<ErrorEventDto, "timestamp" | "kind"> {
  kind: "error";
  timestamp: Date;
}

export type PersistedEventEntity = AuditEventEntity | ErrorEventEntity;

export function toPersistedEventDto(
  event: PersistedEventEntity,
): PersistedEventDto {
  return {
    ...event,
    timestamp: event.timestamp.toISOString(),
  };
}
