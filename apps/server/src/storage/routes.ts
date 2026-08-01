import {
  StorageSummaryResponseSchema,
  type StorageSummaryResponse,
} from "@projeto-home/contracts";
import { Router, type Request, type Response } from "express";
import type { AppLocals, NoRequestBody, NoRouteParams } from "../observability/routes.js";
import type { StorageService } from "./storage-service.js";

type StorageSummaryRequest = Request<NoRouteParams, StorageSummaryResponse, NoRequestBody, Record<string, never>, AppLocals>;
type StorageSummaryResponseWriter = Response<StorageSummaryResponse, AppLocals>;

export function createStorageRouter(dependencies: { service: StorageService }) {
  const router = Router();
  router.get<NoRouteParams, StorageSummaryResponse, NoRequestBody, Record<string, never>, AppLocals>(
    "/locations",
    async (_request: StorageSummaryRequest, response: StorageSummaryResponseWriter) => {
      response.status(200).json(StorageSummaryResponseSchema.parse(await dependencies.service.getSummary()));
    },
  );
  return router;
}
