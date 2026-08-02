import {
  AssistantQueryResponseSchema,
  MathEvaluationRequestSchema,
  MathEvaluationResultSchema,
  SystemMetricsResponseSchema,
  type AssistantQueryRequest,
  type AssistantQueryResponse,
} from "@projeto-home/contracts";
import type { OperationalLogger } from "../logging/operational-logger.js";
import type { ToolRegistry } from "../tools/registry.js";
import {
  createAssistantResponsePrompt,
  extractExplicitMathExpression,
  isExplicitMetricsQuery,
  isRequestDurationQuery,
  isServerOnlineQuery,
} from "./assistant-context.js";
import { createCalculationResponse, createMetricsResponse } from "./tool-response.js";
import {
  InvalidLocalAIRequestError,
  InvalidLocalAIResponseError,
  LocalAITimeoutError,
  LocalAIUnavailableError,
  type LocalAIService,
} from "./local-ai-service.js";

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
        if (isServerOnlineQuery(input.query.query)) {
          return executeStaticTextQuery(
            dependencies,
            input,
            startedAt,
            "A API do Projeto Home esta online e processou esta consulta.",
            "server_online",
          );
        }

        if (isExplicitMetricsQuery(input.query.query)) {
          return executeMetricsQuery(dependencies, input, startedAt);
        }

        const explicitExpression = extractExplicitMathExpression(input.query.query);
        if (explicitExpression) {
          return executeMathQuery(dependencies, input, startedAt, explicitExpression);
        }

        if (isRequestDurationQuery(input.query.query)) {
          return executeStaticTextQuery(
            dependencies,
            input,
            startedAt,
            "O sistema ainda nao calcula uma media de duracao das requisicoes. Os tempos individuais aparecem nos logs operacionais.",
            "request_duration_unavailable",
          );
        }

        return executeGeneralTextQuery(dependencies, input, startedAt);
      } catch (error) {
        logQuery(dependencies.logger, input, "failure", startedAt, {
          errorCode: getFailureCode(error),
        });
        throw error;
      }
    },
  };
}

async function executeGeneralTextQuery(
  dependencies: Parameters<typeof createQueryAssistant>[0],
  input: Parameters<QueryAssistant["execute"]>[0],
  startedAt: bigint,
) {
  const message = await generateGroundedText(dependencies.localAIService, input.query.query);
  return executeStaticTextQuery(dependencies, input, startedAt, message, "text");
}

function executeStaticTextQuery(
  dependencies: Parameters<typeof createQueryAssistant>[0],
  input: Parameters<QueryAssistant["execute"]>[0],
  startedAt: bigint,
  message: string,
  result: string,
) {
  const response = AssistantQueryResponseSchema.parse({
    kind: "text",
    message,
    requestId: input.requestId,
    correlationId: input.correlationId,
  });
  logQuery(dependencies.logger, input, "success", startedAt, { result });
  return response;
}

async function executeMetricsQuery(
  dependencies: Parameters<typeof createQueryAssistant>[0],
  input: Parameters<QueryAssistant["execute"]>[0],
  startedAt: bigint,
) {
  const result = SystemMetricsResponseSchema.parse(await dependencies.toolRegistry.execute(
    "system.get_metrics",
    {},
    { requestId: input.requestId, correlationId: input.correlationId },
  ));
  const message = createMetricsResponse(input.query.query, result);
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
}

async function executeMathQuery(
  dependencies: Parameters<typeof createQueryAssistant>[0],
  input: Parameters<QueryAssistant["execute"]>[0],
  startedAt: bigint,
  expression: string,
) {
  const result = MathEvaluationResultSchema.parse(await dependencies.toolRegistry.execute(
    "math.evaluate",
    MathEvaluationRequestSchema.parse({ expression }),
    { requestId: input.requestId, correlationId: input.correlationId },
  ));
  const message = createCalculationResponse(result);
  const response = AssistantQueryResponseSchema.parse({
    kind: "tool_result",
    message,
    tool: "math.evaluate",
    data: result,
    requestId: input.requestId,
    correlationId: input.correlationId,
  });
  logQuery(dependencies.logger, input, "success", startedAt, { tool: "math.evaluate" });
  return response;
}

function getFailureCode(error: unknown): string {
  if (error instanceof InvalidAssistantTextError) return "invalid_assistant_text";
  if (error instanceof InvalidLocalAIRequestError) return "invalid_local_ai_request";
  if (error instanceof InvalidLocalAIResponseError) return "invalid_local_ai_response";
  if (error instanceof LocalAITimeoutError) return "local_ai_timeout";
  if (error instanceof LocalAIUnavailableError) return "local_ai_unavailable";
  return "assistant_query_failed";
}

export class InvalidAssistantTextError extends Error {
  constructor() {
    super("invalid_assistant_text");
  }
}

async function generateGroundedText(
  localAIService: LocalAIService,
  query: string,
): Promise<string> {
  const response = await localAIService.generate({
    messages: [{
      role: "system",
      content: createAssistantResponsePrompt(query),
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
