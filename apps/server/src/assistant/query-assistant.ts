import {
  AssistantQueryResponseSchema,
  SystemMetricsResponseSchema,
  type AssistantQueryRequest,
  type AssistantQueryResponse,
} from "@projeto-home/contracts";
import { z } from "zod";
import type { OperationalLogger } from "../logging/operational-logger.js";
import type { ToolRegistry } from "../tools/registry.js";
import {
  createAssistantResponsePrompt,
  isExplicitMetricsQuery,
} from "./assistant-context.js";
import {
  InvalidLocalAIRequestError,
  InvalidLocalAIResponseError,
  LocalAITimeoutError,
  LocalAIUnavailableError,
  type LocalAIService,
} from "./local-ai-service.js";

const ToolDecisionSchema = z
  .object({
    action: z.literal("tool"),
    tool: z.literal("system.get_metrics"),
    arguments: z.object({}).strict(),
  })
  .strict();
const TextDecisionSchema = z.object({ action: z.literal("text") }).strict();
const AssistantDecisionSchema = z.union([ToolDecisionSchema, TextDecisionSchema]);

const decisionPrompt = [
  "/no_think Voce e o classificador do assistente local Projeto Home.",
  "Responda somente JSON valido, sem markdown e sem chaves extras.",
  "Para perguntas sobre dados atuais do servidor, uptime, memoria, swap, armazenamento, espaco, temperatura da CPU ou bateria, incluindo 'Como esta a memoria e a temperatura do servidor?', responda {\"action\":\"tool\",\"tool\":\"system.get_metrics\",\"arguments\":{}}.",
  "Para qualquer outra pergunta, responda {\"action\":\"text\"}.",
].join(" ");

export interface QueryAssistant {
  execute(input: {
    query: AssistantQueryRequest;
    requestId: string;
    correlationId: string;
  }): Promise<AssistantQueryResponse>;
}

export function createQueryAssistant(dependencies: {
  localAIService: LocalAIService;
  toolRegistry: ToolRegistry;
  logger: OperationalLogger;
}): QueryAssistant {
  return {
    async execute(input) {
      const startedAt = process.hrtime.bigint();
      try {
        const decisionResponse = await dependencies.localAIService.generate({
          messages: [
            { role: "system", content: decisionPrompt },
            { role: "user", content: input.query.query },
          ],
          maxTokens: 96,
        });
        const decision = parseDecision(decisionResponse.content);
        const shouldUseMetrics = decision.action === "tool" || isExplicitMetricsQuery(input.query.query);

        if (!shouldUseMetrics) {
          const message = await generateGroundedText(dependencies.localAIService, input.query.query);
          const response = AssistantQueryResponseSchema.parse({
            kind: "text",
            message,
            requestId: input.requestId,
            correlationId: input.correlationId,
          });
          logQuery(dependencies.logger, input, "success", startedAt, { result: "text" });
          return response;
        }

        const result = SystemMetricsResponseSchema.parse(
          await dependencies.toolRegistry.execute(
            "system.get_metrics",
            {},
            {
              requestId: input.requestId,
              correlationId: input.correlationId,
            },
          ),
        );
        const message = await generateGroundedText(
          dependencies.localAIService,
          input.query.query,
          result,
        );
        const response = AssistantQueryResponseSchema.parse({
          kind: "tool_result",
          message,
          tool: "system.get_metrics",
          data: result,
          requestId: input.requestId,
          correlationId: input.correlationId,
        });
        logQuery(dependencies.logger, input, "success", startedAt, { tool: "system.get_metrics" });
        return response;
      } catch (error) {
        logQuery(dependencies.logger, input, "failure", startedAt, {
          errorCode: getFailureCode(error),
        });
        throw error;
      }
    },
  };
}

function getFailureCode(error: unknown): string {
  if (error instanceof InvalidAssistantDecisionError) return "invalid_assistant_decision";
  if (error instanceof InvalidAssistantTextError) return "invalid_assistant_text";
  if (error instanceof InvalidLocalAIRequestError) return "invalid_local_ai_request";
  if (error instanceof InvalidLocalAIResponseError) return "invalid_local_ai_response";
  if (error instanceof LocalAITimeoutError) return "local_ai_timeout";
  if (error instanceof LocalAIUnavailableError) return "local_ai_unavailable";
  return "assistant_query_failed";
}

export class InvalidAssistantDecisionError extends Error {
  constructor() {
    super("invalid_assistant_decision");
  }
}

export class InvalidAssistantTextError extends Error {
  constructor() {
    super("invalid_assistant_text");
  }
}

function parseDecision(content: string) {
  try {
    const parsed = AssistantDecisionSchema.safeParse(JSON.parse(content));
    if (parsed.success) return parsed.data;
  } catch {
    // The model output is untrusted and intentionally has no fallback parser.
  }
  throw new InvalidAssistantDecisionError();
}

async function generateGroundedText(
  localAIService: LocalAIService,
  query: string,
  metrics?: ReturnType<typeof SystemMetricsResponseSchema.parse>,
): Promise<string> {
  const response = await localAIService.generate({
    messages: [{
      role: "system",
      content: createAssistantResponsePrompt({
        query,
        ...(metrics === undefined ? {} : { metrics }),
      }),
    }],
    maxTokens: 128,
  });
  const message = response.content.trim();
  if (!message || message.length > 480) throw new InvalidAssistantTextError();
  return message;
}

function logQuery(
  logger: OperationalLogger,
  input: { requestId: string; correlationId: string },
  outcome: "success" | "failure",
  startedAt: bigint,
  context: Record<string, string>,
) {
  logger.log({
    level: outcome === "success" ? "info" : "warn",
    service: "assistant",
    action: "assistant.query",
    outcome,
    requestId: input.requestId,
    correlationId: input.correlationId,
    durationMs: Number(process.hrtime.bigint() - startedAt) / 1_000_000,
    context,
  });
}
