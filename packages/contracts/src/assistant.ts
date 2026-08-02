import { z } from "zod";

export const AssistantQueryRequestSchema = z
  .object({ query: z.string().trim().min(1).max(4_096) })
  .strict();

const AssistantBaseResponseSchema = z.object({
  requestId: z.string().uuid(),
  correlationId: z.string().uuid(),
}).strict();

export const AssistantQueryResponseSchema = z.discriminatedUnion("kind", [
  AssistantBaseResponseSchema.extend({
    kind: z.literal("tool_result"),
    message: z.string().min(1).max(480),
  }),
  AssistantBaseResponseSchema.extend({
    kind: z.literal("text"),
    message: z.string().min(1).max(480),
  }),
]);

export type AssistantQueryRequest = z.infer<typeof AssistantQueryRequestSchema>;
export type AssistantQueryResponse = z.infer<typeof AssistantQueryResponseSchema>;
