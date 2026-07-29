import {
  SystemMetricsResponseSchema,
  type SystemMetricsResponse,
} from "@projeto-home/contracts";
import { Router, type Request, type Response } from "express";
import type { AppLocals, NoRequestBody, NoRouteParams } from "../observability/routes.js";
import type { SystemMetricsCollector } from "./system-metrics.js";

type MetricsRequest = Request<NoRouteParams, SystemMetricsResponse, NoRequestBody, Record<string, never>, AppLocals>;
type MetricsResponse = Response<SystemMetricsResponse, AppLocals>;

export function createMonitoringRouter(dependencies: { collector: SystemMetricsCollector }) {
  const router = Router();
  router.get<NoRouteParams, SystemMetricsResponse, NoRequestBody, Record<string, never>, AppLocals>(
    "/metrics",
    async (_request: MetricsRequest, response: MetricsResponse) => {
      const payload = SystemMetricsResponseSchema.parse(await dependencies.collector.collect());
      response.status(200).json(payload);
    },
  );
  return router;
}
