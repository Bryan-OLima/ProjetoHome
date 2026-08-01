import {
  AssistantQueryResponseSchema,
  ErrorResponseSchema,
} from "@projeto-home/contracts";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import type { QueryAssistant } from "../src/assistant/query-assistant.js";
import { LocalAIUnavailableError } from "../src/assistant/local-ai-service.js";
import { InvalidMathExpressionError } from "../src/tools/math-tool.js";
import { createTestDatabase } from "./helpers.js";

const cleanups: Array<() => void> = [];
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()));

describe("POST /api/assistant/query", () => {
  it("returns the validated result with request and correlation identifiers", async () => {
    const testDatabase = createTestDatabase("assistant-route");
    cleanups.push(testDatabase.cleanup);
    const execute = vi.fn(async ({ requestId, correlationId }: Parameters<QueryAssistant["execute"]>[0]) => ({
      kind: "text" as const,
      message: "O Projeto Home pode consultar as metricas atuais do servidor.",
      requestId,
      correlationId,
    }));
    const app = createApp({ database: testDatabase.database, version: "test", queryAssistant: { execute } });

    const response = await request(app)
      .post("/api/assistant/query")
      .send({ query: "Como esta o servidor?" })
      .expect(200);
    const payload = AssistantQueryResponseSchema.parse(response.body);

    expect(payload.requestId).toBe(response.headers["x-request-id"]);
    expect(payload.correlationId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ query: { query: "Como esta o servidor?" } }));
  });

  it("rejects malformed input without invoking the assistant", async () => {
    const testDatabase = createTestDatabase("assistant-invalid-request");
    cleanups.push(testDatabase.cleanup);
    const execute = vi.fn();
    const app = createApp({ database: testDatabase.database, version: "test", queryAssistant: { execute } });

    const response = await request(app).post("/api/assistant/query").send({ query: " " }).expect(400);

    expect(ErrorResponseSchema.parse(response.body).error.code).toBe("invalid_request");
    expect(execute).not.toHaveBeenCalled();
  });

  it("reports a local runtime outage without leaking details", async () => {
    const testDatabase = createTestDatabase("assistant-unavailable");
    cleanups.push(testDatabase.cleanup);
    const app = createApp({
      database: testDatabase.database,
      version: "test",
      queryAssistant: { async execute() { throw new LocalAIUnavailableError(); } },
    });

    const response = await request(app)
      .post("/api/assistant/query")
      .send({ query: "Como esta o servidor?" })
      .expect(503);

    expect(ErrorResponseSchema.parse(response.body).error).toMatchObject({
      code: "local_ai_unavailable",
      message: "Local AI is unavailable.",
    });
  });

  it("rejects an invalid local calculation with a safe client error", async () => {
    const testDatabase = createTestDatabase("assistant-invalid-calculation");
    cleanups.push(testDatabase.cleanup);
    const app = createApp({
      database: testDatabase.database,
      version: "test",
      queryAssistant: { async execute() { throw new InvalidMathExpressionError(); } },
    });

    const response = await request(app)
      .post("/api/assistant/query")
      .send({ query: "Quanto e 10 / 0?" })
      .expect(400);

    expect(ErrorResponseSchema.parse(response.body).error).toMatchObject({
      code: "invalid_request",
      message: "Calculation is invalid.",
    });
  });
});
