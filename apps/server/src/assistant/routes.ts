import {
  AssistantQueryRequestSchema,
  AssistantQueryResponseSchema,
  type AssistantQueryRequest,
  type AssistantQueryResponse,
} from "@projeto-home/contracts";
import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { HttpError } from "../http-error.js";
import type { AppLocals, NoRouteParams } from "../observability/routes.js";
import {
  InvalidAssistantTextError,
  type QueryAssistant,
} from "./query-assistant.js";
import {
  InvalidLocalAIResponseError,
  LocalAITimeoutError,
  LocalAIUnavailableError,
} from "./local-ai-service.js";
import { InvalidMathExpressionError } from "../tools/math-tool.js";

type AssistantRequest = Request<
  NoRouteParams,
  AssistantQueryResponse,
  AssistantQueryRequest,
  Record<string, never>,
  AppLocals
>;
type AssistantResponse = Response<AssistantQueryResponse, AppLocals>;

export function createAssistantRouter(dependencies: { queryAssistant: QueryAssistant }) {
  const router = Router();
  router.post<
    NoRouteParams,
    AssistantQueryResponse,
    AssistantQueryRequest,
    Record<string, never>,
    AppLocals
  >("/query", async (request: AssistantRequest, response: AssistantResponse) => {
    const parsedRequest = AssistantQueryRequestSchema.safeParse(request.body);
    if (!parsedRequest.success) {
      throw new HttpError(400, "invalid_request", "Request body is invalid.");
    }
    try {
      const payload = AssistantQueryResponseSchema.parse(
        await dependencies.queryAssistant.execute({
          query: parsedRequest.data,
          requestId: response.locals.requestId,
          correlationId: randomUUID(),
        }),
      );
      response.status(200).json(payload);
    } catch (error) {
      if (error instanceof LocalAIUnavailableError) {
        throw new HttpError(503, "local_ai_unavailable", "Local AI is unavailable.");
      }
      if (error instanceof LocalAITimeoutError) {
        throw new HttpError(504, "local_ai_timeout", "Local AI did not respond in time.");
      }
      if (error instanceof InvalidMathExpressionError) {
        throw new HttpError(400, "invalid_request", "Calculation is invalid.");
      }
      if (
        error instanceof InvalidLocalAIResponseError ||
        error instanceof InvalidAssistantTextError
      ) {
        throw new HttpError(502, "local_ai_invalid_response", "Local AI returned an invalid response.");
      }
      throw error;
    }
  });
  return router;
}
