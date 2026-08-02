import {
  MathEvaluationResultSchema,
  SystemMetricsResponseSchema,
} from "@projeto-home/contracts";
import { describe, expect, it, vi } from "vitest";
import {
  createQueryAssistant,
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
  it("uses the read-only metrics tool for an explicit metric query", async () => {
    const execute = vi.fn(async () => metrics);
    const log = vi.fn();
    const generate = vi.fn();
    const assistant = createQueryAssistant({ localAIService: { generate }, toolRegistry: { execute }, logger: { log } });

    const response = await assistant.execute({ query: { query: "Me mostre o uptime atual." }, ...metadata });

    expect(response).toMatchObject({ kind: "tool_result" });
    expect(response).not.toHaveProperty("tool");
    expect(response).not.toHaveProperty("data");
    expect(response.message).toBe("Dados atuais do servidor: Uptime: 42 s.");
    expect(execute).toHaveBeenCalledWith("system.get_metrics", {}, metadata);
    expect(generate).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ context: { tool: "system.get_metrics" } }));
  });

  it("uses a safe metrics fallback for explicit current metric queries", async () => {
    const execute = vi.fn(async () => metrics);
    const generate = vi.fn();
    const assistant = createQueryAssistant({ localAIService: { generate }, toolRegistry: { execute }, logger: { log: vi.fn() } });

    await expect(assistant.execute({
      query: { query: "Como est\u00e1 a mem\u00f3ria e a temperatura do servidor?" },
      ...metadata,
    })).resolves.toMatchObject({
      kind: "tool_result",
      message: "Dados atuais do servidor: Mem\u00f3ria dispon\u00edvel: 0.0 GB de 0.0 GB.",
    });
    expect(execute).toHaveBeenCalledOnce();
    expect(generate).not.toHaveBeenCalled();
  });

  it("evaluates explicit arithmetic locally before generating the response", async () => {
    const calculation = MathEvaluationResultSchema.parse({ expression: "127 * 43", value: 5461 });
    const execute = vi.fn(async () => calculation);
    const generate = vi.fn();
    const assistant = createQueryAssistant({ localAIService: { generate }, toolRegistry: { execute }, logger: { log: vi.fn() } });

    await expect(assistant.execute({ query: { query: "Quanto e 127 x 43?" }, ...metadata }))
      .resolves.toMatchObject({
        kind: "tool_result",
        message: "O resultado de 127 * 43 \u00e9 5.461.",
      });
    expect(execute).toHaveBeenCalledWith("math.evaluate", { expression: "127 * 43" }, metadata);
    expect(generate).not.toHaveBeenCalled();
  });

  it("generates natural text without a tool decision for general questions", async () => {
    const execute = vi.fn();
    const generate = vi.fn()
      .mockResolvedValueOnce({ content: "O sentido da vida pode ser construido pelas escolhas e relacoes de cada pessoa." });
    const assistant = createQueryAssistant({ localAIService: { generate }, toolRegistry: { execute }, logger: { log: vi.fn() } });

    await expect(assistant.execute({ query: { query: "Qual o sentido da vida?" }, ...metadata }))
      .resolves.toMatchObject({
        kind: "text",
        message: "O sentido da vida pode ser construido pelas escolhas e relacoes de cada pessoa.",
      });
    expect(execute).not.toHaveBeenCalled();
    expect(generate).toHaveBeenCalledOnce();
    expect(generate.mock.calls[0]?.[0].messages[0].content).toContain("Gmail");
  });

  it("answers server availability without requiring the local model", async () => {
    const execute = vi.fn();
    const log = vi.fn();
    const assistant = createQueryAssistant({
      localAIService: { generate: vi.fn() },
      toolRegistry: { execute },
      logger: { log },
    });

    await expect(assistant.execute({ query: { query: "Confirma pra mim se o servidor esta online" }, ...metadata }))
      .resolves.toMatchObject({
        kind: "text",
        message: "A API do Projeto Home esta online e processou esta consulta.",
      });
    expect(execute).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      action: "assistant.query",
      outcome: "success",
      context: { result: "server_online" },
    }));
  });

  it("explains unavailable request duration without inventing a value", async () => {
    const execute = vi.fn();
    const generate = vi.fn();
    const assistant = createQueryAssistant({
      localAIService: { generate },
      toolRegistry: { execute },
      logger: { log: vi.fn() },
    });

    await expect(assistant.execute({ query: { query: "Quanto tempo demora uma requisi\u00e7\u00e3o?" }, ...metadata }))
      .resolves.toMatchObject({
        kind: "text",
        message: "O sistema ainda nao calcula uma media de duracao das requisicoes. Os tempos individuais aparecem nos logs operacionais.",
      });
    expect(execute).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });
});
