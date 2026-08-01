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
  it("executes only the decision from the allowlisted tool contract", async () => {
    const execute = vi.fn(async () => metrics);
    const log = vi.fn();
    const assistant = createQueryAssistant({
      localAIService: {
        generate: async () => ({ content: "{\"action\":\"tool\",\"tool\":\"system.get_metrics\",\"arguments\":{}}" }),
      },
      toolRegistry: { execute },
      logger: { log },
    });

    const response = await assistant.execute({ query: { query: "Como está o servidor?" }, ...metadata });

    expect(response).toMatchObject({ kind: "tool_result", tool: "system.get_metrics", data: metrics });
    expect(execute).toHaveBeenCalledWith("system.get_metrics", {}, metadata);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      action: "assistant.query",
      requestId: metadata.requestId,
      correlationId: metadata.correlationId,
      context: { tool: "system.get_metrics" },
    }));
  });

  it("returns a safe response for a request without an authorized tool", async () => {
    const execute = vi.fn();
    const assistant = createQueryAssistant({
      localAIService: { generate: async () => ({ content: "{\"action\":\"unsupported\"}" }) },
      toolRegistry: { execute },
      logger: { log: vi.fn() },
    });

    await expect(assistant.execute({ query: { query: "Abra meus e-mails" }, ...metadata }))
      .resolves.toMatchObject({ kind: "unsupported" });
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects malformed model output instead of guessing a tool", async () => {
    const execute = vi.fn();
    const log = vi.fn();
    const assistant = createQueryAssistant({
      localAIService: { generate: async () => ({ content: "system.get_metrics" }) },
      toolRegistry: { execute },
      logger: { log },
    });

    await expect(assistant.execute({ query: { query: "Como está o servidor?" }, ...metadata }))
      .rejects.toBeInstanceOf(InvalidAssistantDecisionError);
    expect(execute).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      action: "assistant.query",
      outcome: "failure",
      context: { errorCode: "invalid_assistant_decision" },
    }));
  });
});
