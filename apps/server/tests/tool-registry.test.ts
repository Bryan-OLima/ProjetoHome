import { SystemMetricsResponseSchema } from "@projeto-home/contracts";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  createToolRegistry,
  defineTool,
  InvalidToolArgumentsError,
  ToolExecutionTimeoutError,
  UnknownToolError,
} from "../src/tools/registry.js";
import { createSystemMetricsTool } from "../src/tools/system-metrics-tool.js";

const context = {
  requestId: "0cbfa599-5bae-416a-82be-6167ab515d09",
  correlationId: "771a7bda-b4d2-4986-9eb0-5d9687815c4f",
};
const EmptyInputSchema = z.object({}).strict();

describe("tool registry", () => {
  it("executes an allowlisted read-only tool and records correlated metadata", async () => {
    const log = vi.fn();
    const payload = SystemMetricsResponseSchema.parse({
      collectedAt: "2026-08-01T12:00:00.000Z",
      serverUptimeSeconds: 42,
      memory: {
        totalBytes: { status: "available", value: 100 },
        availableBytes: { status: "available", value: 75 },
      },
      swap: {
        totalBytes: { status: "unavailable" },
        usedBytes: { status: "unavailable" },
      },
      storage: {
        totalBytes: { status: "available", value: 100 },
        availableBytes: { status: "available", value: 50 },
      },
      temperatures: {
        cpuCelsius: { status: "available", value: 36 },
        batteryCelsius: { status: "unavailable" },
      },
    });
    const registry = createToolRegistry({
      logger: { log },
      tools: [createSystemMetricsTool({ collector: { collect: async () => payload } })],
    });

    await expect(registry.execute("system.get_metrics", {}, context)).resolves.toEqual(payload);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      action: "assistant.tool",
      outcome: "success",
      requestId: context.requestId,
      correlationId: context.correlationId,
      context: { tool: "system.get_metrics", permission: "monitoring.read" },
    }));
  });

  it("rejects a tool that is not allowlisted", async () => {
    const log = vi.fn();
    const registry = createToolRegistry({ logger: { log }, tools: [] });

    await expect(registry.execute("shell.execute", {}, context)).rejects.toBeInstanceOf(UnknownToolError);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      errorCode: "unknown_tool",
      context: { tool: "shell.execute" },
    }));
  });

  it("rejects invalid arguments before a handler is invoked", async () => {
    const execute = vi.fn();
    const registry = createToolRegistry({
      logger: { log: vi.fn() },
      tools: [defineTool({
        name: "test.empty",
        description: "Test-only tool.",
        permission: "test.read",
        timeoutMs: 100,
        inputSchema: EmptyInputSchema,
        outputSchema: SystemMetricsResponseSchema,
        execute,
      })],
    });

    await expect(registry.execute("test.empty", { unexpected: true }, context)).rejects.toBeInstanceOf(InvalidToolArgumentsError);
    expect(execute).not.toHaveBeenCalled();
  });

  it("fails within the declared tool timeout", async () => {
    const registry = createToolRegistry({
      logger: { log: vi.fn() },
      tools: [defineTool({
        name: "test.slow",
        description: "Test-only tool.",
        permission: "test.read",
        timeoutMs: 5,
        inputSchema: EmptyInputSchema,
        outputSchema: SystemMetricsResponseSchema,
        async execute() {
          return new Promise(() => undefined);
        },
      })],
    });

    await expect(registry.execute("test.slow", {}, context)).rejects.toBeInstanceOf(ToolExecutionTimeoutError);
  });
});
