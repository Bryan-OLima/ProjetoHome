import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id"),
    permission: text("permission"),
    outcome: text("outcome", { enum: ["success", "failure"] }).notNull(),
    requestId: text("request_id"),
    correlationId: text("correlation_id"),
    context: text("context"),
  },
  (table) => [
    index("audit_events_timestamp_idx").on(table.timestamp),
    index("audit_events_action_idx").on(table.action),
    index("audit_events_correlation_id_idx").on(table.correlationId),
  ],
);

export const errorEvents = sqliteTable(
  "error_events",
  {
    id: text("id").primaryKey(),
    timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull(),
    service: text("service").notNull(),
    action: text("action").notNull(),
    errorCode: text("error_code"),
    message: text("message"),
    requestId: text("request_id"),
    correlationId: text("correlation_id"),
    durationMs: integer("duration_ms"),
    context: text("context"),
  },
  (table) => [
    index("error_events_timestamp_idx").on(table.timestamp),
    index("error_events_service_idx").on(table.service),
    index("error_events_correlation_id_idx").on(table.correlationId),
  ],
);
