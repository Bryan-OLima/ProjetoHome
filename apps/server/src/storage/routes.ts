import {
  StorageSummaryResponseSchema,
  ListStorageItemsQuerySchema,
  ListStorageItemsResponseSchema,
  type ListStorageItemsQuery,
  type ListStorageItemsQueryInput,
  type ListStorageItemsResponse,
  type StorageSummaryResponse,
} from "@projeto-home/contracts";
import { Router, type Request, type Response } from "express";
import { HttpError } from "../http-error.js";
import type { AppLocals, NoRequestBody, NoRouteParams } from "../observability/routes.js";
import type { StorageService } from "./storage-service.js";

type StorageSummaryRequest = Request<NoRouteParams, StorageSummaryResponse, NoRequestBody, Record<string, never>, AppLocals>;
type StorageSummaryResponseWriter = Response<StorageSummaryResponse, AppLocals>;
type StorageItemsRequest = Request<NoRouteParams, ListStorageItemsResponse, NoRequestBody, ListStorageItemsQueryInput, AppLocals>;
type StorageItemsResponseWriter = Response<ListStorageItemsResponse, AppLocals>;

export function createStorageRouter(dependencies: { service: StorageService }) {
  const router = Router();
  router.get<NoRouteParams, StorageSummaryResponse, NoRequestBody, Record<string, never>, AppLocals>(
    "/locations",
    async (_request: StorageSummaryRequest, response: StorageSummaryResponseWriter) => {
      response.status(200).json(StorageSummaryResponseSchema.parse(await dependencies.service.getSummary()));
    },
  );
  router.get<NoRouteParams, ListStorageItemsResponse, NoRequestBody, ListStorageItemsQueryInput, AppLocals>(
    "/internal/items",
    async (request: StorageItemsRequest, response: StorageItemsResponseWriter) => {
      const parsedQuery = ListStorageItemsQuerySchema.safeParse(request.query);
      if (!parsedQuery.success) {
        throw new HttpError(400, "invalid_request", "Request parameters are invalid.");
      }
      const query: ListStorageItemsQuery = parsedQuery.data;
      response.status(200).json(ListStorageItemsResponseSchema.parse(await dependencies.service.listItems(query.limit)));
    },
  );
  return router;
}
