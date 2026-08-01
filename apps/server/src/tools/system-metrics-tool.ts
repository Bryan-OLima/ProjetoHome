import { SystemMetricsResponseSchema } from "@projeto-home/contracts";
import { z } from "zod";
import type { SystemMetricsCollector } from "../monitoring/system-metrics.js";
import { defineTool } from "./registry.js";

const SystemMetricsToolInputSchema = z.object({}).strict();

export function createSystemMetricsTool(dependencies: {
  collector: SystemMetricsCollector;
}) {
  return defineTool({
    name: "system.get_metrics",
    description: "Returns the current server monitoring metrics.",
    permission: "monitoring.read",
    timeoutMs: 1_500,
    inputSchema: SystemMetricsToolInputSchema,
    outputSchema: SystemMetricsResponseSchema,
    async execute() {
      return dependencies.collector.collect();
    },
  });
}
