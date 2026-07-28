import { z } from "zod";
import { LogOutcomeSchema } from "./logging.js";

const AuditIdentifierSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);

export const AuditEventSchema = z
  .object({
    timestamp: z.string().datetime(),
    actor: AuditIdentifierSchema,
    action: AuditIdentifierSchema,
    resourceType: AuditIdentifierSchema,
    resourceId: z.string().min(1).max(200).optional(),
    permission: AuditIdentifierSchema.optional(),
    outcome: LogOutcomeSchema,
    requestId: z.string().uuid().optional(),
    correlationId: z.string().uuid().optional(),
    context: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type AuditEvent = z.infer<typeof AuditEventSchema>;
