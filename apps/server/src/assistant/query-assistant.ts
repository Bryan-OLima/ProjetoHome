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
const UnsupportedDecisionSchema = z.object({ action: z.literal("unsupported") }).strict();
const TextDecisionSchema = z
  .object({ action: z.literal("text"), message: z.string().trim().min(1).max(480) })
  .strict();
const AssistantDecisionSchema = z.union([
  ToolDecisionSchema,
  UnsupportedDecisionSchema,
  TextDecisionSchema,
]);

const decisionPrompt = [
  "/no_think Voc\u00ea \u00e9 o assistente local do Projeto Home.",
  "Responda somente JSON v\u00e1lido, sem markdown e sem chaves extras.",
  "Para perguntas sobre o estado atual do servidor, uptime, mem\u00f3ria, swap, armazenamento, temperatura da CPU ou bateria, incluindo por exemplo 'Como est\u00e1 a mem\u00f3ria do servidor?', responda {\"action\":\"tool\",\"tool\":\"system.get_metrics\",\"arguments\":{}}.",
  "Para perguntas gerais sobre as capacidades, ferramentas, privacidade ou limites do Projeto Home, responda {\"action\":\"text\",\"message\":\"resposta curta em portugu\u00eas\"}. N\u00e3o afirme dados atuais nem a execu\u00e7\u00e3o de uma a\u00e7\u00e3o nessa resposta.",
  "Para qualquer pedido fora das capacidades atuais, responda {\"action\":\"unsupported\"}.",
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

        if (decision.action === "unsupported") {
          const response = AssistantQueryResponseSchema.parse({
            kind: "unsupported",
            message: "Esta consulta ainda n\u00e3o possui uma ferramenta autorizada.",
            requestId: input.requestId,
            correlationId: input.correlationId,
          });
          logQuery(dependencies.logger, input, "success", startedAt, { result: "unsupported" });
          return response;
        }

        if (decision.action === "text") {
          const response = AssistantQueryResponseSchema.parse({
            kind: "text",
            message: decision.message,
            requestId: input.requestId,
            correlationId: input.correlationId,
          });
          logQuery(dependencies.logger, input, "success", startedAt, { result: "text" });
          return response;
        }

        const result = SystemMetricsResponseSchema.parse(
          await dependencies.toolRegistry.execute(
            decision.tool,
            decision.arguments,
            {
              requestId: input.requestId,
              correlationId: input.correlationId,
            },
          ),
        );
        const response = AssistantQueryResponseSchema.parse({
          kind: "tool_result",
          message: "M\u00e9tricas atuais do servidor consultadas.",
          tool: decision.tool,
          data: result,
          requestId: input.requestId,
          correlationId: input.correlationId,
        });
        logQuery(dependencies.logger, input, "success", startedAt, { tool: decision.tool });
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

function parseDecision(content: string) {
  try {
    const parsed = AssistantDecisionSchema.safeParse(JSON.parse(content));
    if (parsed.success) return parsed.data;
  } catch {
    // The model output is untrusted and intentionally has no fallback parser.
  }
  throw new InvalidAssistantDecisionError();
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
