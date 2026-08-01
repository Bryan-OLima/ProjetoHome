import { z } from "zod";
import type { OperationalLogger } from "../logging/operational-logger.js";

export interface ToolExecutionContext {
  requestId: string;
  correlationId: string;
}

export interface ToolDefinition<
  InputSchema extends z.ZodType = z.ZodType,
  OutputSchema extends z.ZodType = z.ZodType,
> {
  name: string;
  description: string;
  permission: string;
  timeoutMs: number;
  inputSchema: InputSchema;
  outputSchema: OutputSchema;
  execute(
    input: z.output<InputSchema>,
    context: ToolExecutionContext,
  ): Promise<z.input<OutputSchema>>;
}

export interface ToolRegistry {
  execute(
    name: string,
    input: unknown,
    context: ToolExecutionContext,
  ): Promise<unknown>;
}

export class UnknownToolError extends Error {
  constructor() {
    super("unknown_tool");
  }
}

export class InvalidToolArgumentsError extends Error {
  constructor() {
    super("invalid_tool_arguments");
  }
}

export class ToolExecutionTimeoutError extends Error {
  constructor() {
    super("tool_execution_timeout");
  }
}

export function defineTool<
  InputSchema extends z.ZodType,
  OutputSchema extends z.ZodType,
>(definition: ToolDefinition<InputSchema, OutputSchema>) {
  if (!definition.name || !definition.permission || definition.timeoutMs < 1) {
    throw new Error("invalid_tool_definition");
  }
  return definition;
}

export function createToolRegistry(dependencies: {
  tools: readonly ToolDefinition[];
  logger: OperationalLogger;
}): ToolRegistry {
  const tools = new Map(dependencies.tools.map((tool) => [tool.name, tool]));
  if (tools.size !== dependencies.tools.length) {
    throw new Error("duplicate_tool_name");
  }

  return {
    async execute(name, input, context) {
      const tool = tools.get(name);
      if (!tool) {
        logToolFailure(dependencies.logger, name, context, "unknown_tool");
        throw new UnknownToolError();
      }

      const parsedInput = tool.inputSchema.safeParse(input);
      if (!parsedInput.success) {
        logToolFailure(dependencies.logger, tool.name, context, "invalid_tool_arguments");
        throw new InvalidToolArgumentsError();
      }

      const startedAt = process.hrtime.bigint();
      try {
        const output = await withTimeout(
          tool.execute(parsedInput.data, context),
          tool.timeoutMs,
        );
        const parsedOutput = tool.outputSchema.safeParse(output);
        if (!parsedOutput.success) throw new Error("invalid_tool_result");

        dependencies.logger.log({
          level: "info",
          service: "assistant",
          action: "assistant.tool",
          outcome: "success",
          requestId: context.requestId,
          correlationId: context.correlationId,
          durationMs: elapsedMilliseconds(startedAt),
          context: { tool: tool.name, permission: tool.permission },
        });
        return parsedOutput.data;
      } catch (error) {
        const errorCode = error instanceof ToolExecutionTimeoutError
          ? "tool_execution_timeout"
          : "tool_execution_failed";
        logToolFailure(
          dependencies.logger,
          tool.name,
          context,
          errorCode,
          elapsedMilliseconds(startedAt),
          tool.permission,
        );
        throw error;
      }
    },
  };
}

function withTimeout<Value>(operation: Promise<Value>, timeoutMs: number): Promise<Value> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new ToolExecutionTimeoutError()), timeoutMs);
    operation.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function elapsedMilliseconds(startedAt: bigint): number {
  return Number(process.hrtime.bigint() - startedAt) / 1_000_000;
}

function logToolFailure(
  logger: OperationalLogger,
  tool: string,
  context: ToolExecutionContext,
  errorCode: string,
  durationMs?: number,
  permission?: string,
) {
  logger.log({
    level: "warn",
    service: "assistant",
    action: "assistant.tool",
    outcome: "failure",
    requestId: context.requestId,
    correlationId: context.correlationId,
    errorCode,
    ...(durationMs === undefined ? {} : { durationMs }),
    context: {
      tool,
      ...(permission === undefined ? {} : { permission }),
    },
  });
}
