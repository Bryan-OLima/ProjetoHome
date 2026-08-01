import { z } from "zod";
import { SystemMetricsResponseSchema } from "./monitoring.js";

export const AssistantQueryRequestSchema = z
  .object({ query: z.string().trim().min(1).max(4_096) })
  .strict();

const AssistantBaseResponseSchema = z.object({
  requestId: z.string().uuid(),
  correlationId: z.string().uuid(),
});

export const AssistantQueryResponseSchema = z.discriminatedUnion("kind", [
  AssistantBaseResponseSchema.extend({
    kind: z.literal("tool_result"),
    message: z.string().min(1).max(240),
    tool: z.literal("system.get_metrics"),
    data: SystemMetricsResponseSchema,
  }),
  AssistantBaseResponseSchema.extend({
    kind: z.literal("unsupported"),
    message: z.string().min(1).max(240),
  }),
]);

export type AssistantQueryRequest = z.infer<typeof AssistantQueryRequestSchema>;
export type AssistantQueryResponse = z.infer<typeof AssistantQueryResponseSchema>;
