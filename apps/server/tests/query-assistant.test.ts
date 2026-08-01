import { SystemMetricsResponseSchema } from "@projeto-home/contracts";
import { describe, expect, it, vi } from "vitest";
import {
  createQueryAssistant,
  InvalidAssistantDecisionError,
} from "../src/assistant/query-assistant.js";

const metadata = {
  requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
  correlationId: "b66aa9b5-3187-40c6-94e9-ca080618b1c7",
};
const metrics = SystemMetricsResponseSchema.parse({
  collectedAt: "2026-08-01T12:00:00.000Z",
  serverUptimeSeconds: 42,
  memory: { totalBytes: { status: "available", value: 100 }, availableBytes: { status: "available", value: 50 } },
  swap: { totalBytes: { status: "unavailable" }, usedBytes: { status: "unavailable" } },
  storage: { totalBytes: { status: "available", value: 100 }, availableBytes: { status: "available", value: 50 } },
  temperatures: { cpuCelsius: { status: "available", value: 36 }, batteryCelsius: { status: "unavailable" } },
});

describe("query assistant", () => {
  it("uses the read-only metrics tool when the model authorizes it", async () => {
    const execute = vi.fn(async () => metrics);
    const log = vi.fn();
    const generate = vi.fn()
      .mockResolvedValueOnce({ content: "{\"action\":\"tool\",\"tool\":\"system.get_metrics\",\"arguments\":{}}" })
      .mockResolvedValueOnce({ content: "A mem\u00f3ria e a temperatura atuais est\u00e3o dispon\u00edveis nos dados consultados." });
    const assistant = createQueryAssistant({ localAIService: { generate }, toolRegistry: { execute }, logger: { log } });

    const response = await assistant.execute({ query: { query: "Como est\u00e1 o servidor?" }, ...metadata });

    expect(response).toMatchObject({ kind: "tool_result", tool: "system.get_metrics", data: metrics });
    expect(execute).toHaveBeenCalledWith("system.get_metrics", {}, metadata);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ context: { tool: "system.get_metrics" } }));
  });

  it("uses a safe metrics fallback for explicit current metric queries", async () => {
    const execute = vi.fn(async () => metrics);
    const generate = vi.fn()
      .mockResolvedValueOnce({ content: "{\"action\":\"text\"}" })
      .mockResolvedValueOnce({ content: "Os dados atuais de mem\u00f3ria e temperatura foram consultados." });
    const assistant = createQueryAssistant({ localAIService: { generate }, toolRegistry: { execute }, logger: { log: vi.fn() } });

    await expect(assistant.execute({
      query: { query: "Como est\u00e1 a mem\u00f3ria e a temperatura do servidor?" },
      ...metadata,
    })).resolves.toMatchObject({ kind: "tool_result" });
    expect(execute).toHaveBeenCalledOnce();
  });

  it("generates grounded text without executing a tool for general questions", async () => {
    const execute = vi.fn();
    const generate = vi.fn()
      .mockResolvedValueOnce({ content: "{\"action\":\"text\"}" })
      .mockResolvedValueOnce({ content: "Posso consultar as m\u00e9tricas atuais do servidor e explicar os limites atuais." });
    const assistant = createQueryAssistant({ localAIService: { generate }, toolRegistry: { execute }, logger: { log: vi.fn() } });

    await expect(assistant.execute({ query: { query: "O que voc\u00ea consegue fazer?" }, ...metadata }))
      .resolves.toMatchObject({ kind: "text" });
    expect(execute).not.toHaveBeenCalled();
    expect(generate.mock.calls[1]?.[0].messages[0].content).toContain("Gmail");
  });

  it("rejects malformed model decisions instead of guessing a tool", async () => {
    const execute = vi.fn();
    const log = vi.fn();
    const assistant = createQueryAssistant({
      localAIService: { generate: async () => ({ content: "system.get_metrics" }) },
      toolRegistry: { execute },
      logger: { log },
    });

    await expect(assistant.execute({ query: { query: "Como est\u00e1 o servidor?" }, ...metadata }))
      .rejects.toBeInstanceOf(InvalidAssistantDecisionError);
    expect(execute).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      action: "assistant.query",
      outcome: "failure",
      context: { errorCode: "invalid_assistant_decision" },
    }));
  });
});
