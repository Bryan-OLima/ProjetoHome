import { z } from "zod";

export const MathEvaluationRequestSchema = z
  .object({ expression: z.string().trim().min(1).max(128) })
  .strict();

export const MathEvaluationResultSchema = z
  .object({
    expression: z.string().min(1).max(128),
    value: z.number().finite(),
  })
  .strict();

export type MathEvaluationRequest = z.infer<typeof MathEvaluationRequestSchema>;
export type MathEvaluationResult = z.infer<typeof MathEvaluationResultSchema>;
