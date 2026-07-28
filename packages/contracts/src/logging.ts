import { z } from "zod";

const LogIdentifierSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/);

export const LogLevelSchema = z.enum(["debug", "info", "warn", "error"]);
export const LogOutcomeSchema = z.enum(["success", "failure"]);

export const OperationalLogEventSchema = z
  .object({
    timestamp: z.string().datetime(),
    level: LogLevelSchema,
    service: LogIdentifierSchema,
    action: LogIdentifierSchema,
    outcome: LogOutcomeSchema,
    requestId: z.string().uuid().optional(),
    correlationId: z.string().uuid().optional(),
    durationMs: z.number().finite().nonnegative().optional(),
    errorCode: LogIdentifierSchema.optional(),
    message: z.string().min(1).max(1_000).optional(),
    context: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export type LogLevel = z.infer<typeof LogLevelSchema>;
export type LogOutcome = z.infer<typeof LogOutcomeSchema>;
export type OperationalLogEvent = z.infer<typeof OperationalLogEventSchema>;
