import type { OperationalLogger } from "../logging/operational-logger.js";
import type { SystemMetricsCollector } from "../monitoring/system-metrics.js";
import { createToolRegistry } from "./registry.js";
import { createSystemMetricsTool } from "./system-metrics-tool.js";
import { createMathTool } from "./math-tool.js";

export function createApplicationToolRegistry(dependencies: {
  logger: OperationalLogger;
  systemMetricsCollector: SystemMetricsCollector;
}) {
  return createToolRegistry({
    logger: dependencies.logger,
    tools: [
      createSystemMetricsTool({ collector: dependencies.systemMetricsCollector }),
      createMathTool(),
    ],
  });
}
