import { z } from "zod";
import {
  LogLevelSchema,
  LogOutcomeSchema,
  OperationalLogEventSchema,
} from "./logging.js";

const IdentifierSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);

const EventIdSchema = z.string().uuid();
const EventTimestampSchema = z.string().datetime();
const EventContextSchema = z.record(z.string(), z.unknown());

export const PersistedEventKindSchema = z.enum(["audit", "error"]);

export const AuditEventDtoSchema = z
  .object({
    kind: z.literal("audit"),
    id: EventIdSchema,
    timestamp: EventTimestampSchema,
    actor: IdentifierSchema,
    action: IdentifierSchema,
    resourceType: IdentifierSchema,
    resourceId: z.string().min(1).max(200).optional(),
    permission: IdentifierSchema.optional(),
    outcome: LogOutcomeSchema,
    requestId: z.string().uuid().optional(),
    correlationId: z.string().uuid().optional(),
    context: EventContextSchema.optional(),
  })
  .strict();

export const ErrorEventDtoSchema = z
  .object({
    kind: z.literal("error"),
    id: EventIdSchema,
    timestamp: EventTimestampSchema,
    service: IdentifierSchema,
    action: IdentifierSchema,
    errorCode: IdentifierSchema.optional(),
    message: z.string().min(1).max(1_000).optional(),
    requestId: z.string().uuid().optional(),
    correlationId: z.string().uuid().optional(),
    durationMs: z.number().int().nonnegative().optional(),
    context: EventContextSchema.optional(),
  })
  .strict();

export const PersistedEventDtoSchema = z.discriminatedUnion("kind", [
  AuditEventDtoSchema,
  ErrorEventDtoSchema,
]);

export const ListPersistedEventsQuerySchema = z
  .object({
    kind: PersistedEventKindSchema.optional(),
    from: EventTimestampSchema.optional(),
    to: EventTimestampSchema.optional(),
    service: IdentifierSchema.optional(),
    action: IdentifierSchema.optional(),
    correlationId: z.string().uuid().optional(),
    cursor: z.string().min(1).max(256).optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform((value) => Number(value))
      .pipe(z.number().int().min(1).max(100))
      .default(50),
  })
  .strict()
  .superRefine((query, context) => {
    if (query.from && query.to && query.from > query.to) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "to must not be earlier than from",
      });
    }
    if (query.kind === "audit" && query.service) {
      context.addIssue({
        code: "custom",
        path: ["service"],
        message: "service can only filter error events",
      });
    }
  });

export const ListPersistedEventsResponseSchema = z
  .object({
    items: z.array(PersistedEventDtoSchema),
    nextCursor: z.string().min(1).max(256).optional(),
  })
  .strict();

export const ListOperationalLogsQuerySchema = z
  .object({
    from: EventTimestampSchema.optional(),
    to: EventTimestampSchema.optional(),
    level: LogLevelSchema.optional(),
    service: IdentifierSchema.optional(),
    action: IdentifierSchema.optional(),
    correlationId: z.string().uuid().optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform((value) => Number(value))
      .pipe(z.number().int().min(1).max(100))
      .default(50),
  })
  .strict()
  .superRefine((query, context) => {
    if (query.from && query.to && query.from > query.to) {
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: "to must not be earlier than from",
      });
    }
  });

export const ListOperationalLogsResponseSchema = z
  .object({
    items: z.array(OperationalLogEventSchema),
    truncated: z.boolean(),
  })
  .strict();

export type PersistedEventKind = z.infer<typeof PersistedEventKindSchema>;
export type AuditEventDto = z.infer<typeof AuditEventDtoSchema>;
export type ErrorEventDto = z.infer<typeof ErrorEventDtoSchema>;
export type PersistedEventDto = z.infer<typeof PersistedEventDtoSchema>;
export type ListPersistedEventsQueryInput = z.input<
  typeof ListPersistedEventsQuerySchema
>;
export type ListPersistedEventsQuery = z.output<
  typeof ListPersistedEventsQuerySchema
>;
export type ListPersistedEventsResponse = z.infer<
  typeof ListPersistedEventsResponseSchema
>;
export type ListOperationalLogsQueryInput = z.input<
  typeof ListOperationalLogsQuerySchema
>;
export type ListOperationalLogsQuery = z.output<
  typeof ListOperationalLogsQuerySchema
>;
export type ListOperationalLogsResponse = z.infer<
  typeof ListOperationalLogsResponseSchema
>;
