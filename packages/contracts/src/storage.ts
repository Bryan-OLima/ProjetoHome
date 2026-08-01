import { z } from "zod";
import { NumericMetricSchema } from "./monitoring.js";

export const StorageLocationSchema = z
  .object({
    id: z.literal("internal"),
    label: z.literal("Armazenamento interno"),
    status: z.enum(["available", "unavailable"]),
    totalBytes: NumericMetricSchema,
    usedBytes: NumericMetricSchema,
    availableBytes: NumericMetricSchema,
  })
  .strict();

export const StorageSummaryResponseSchema = z
  .object({ locations: z.array(StorageLocationSchema).length(1) })
  .strict();

export type StorageLocation = z.infer<typeof StorageLocationSchema>;
export type StorageSummaryResponse = z.infer<typeof StorageSummaryResponseSchema>;

export const StorageItemSchema = z.object({
  name: z.string().min(1).max(255),
  kind: z.enum(["file", "directory", "symlink", "other"]),
  sizeBytes: z.number().int().nonnegative(),
  modifiedAt: z.string().datetime(),
}).strict();

export const ListStorageItemsQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(50),
}).strict();

export const ListStorageItemsResponseSchema = z.object({
  items: z.array(StorageItemSchema),
  truncated: z.boolean(),
}).strict();

export type StorageItem = z.infer<typeof StorageItemSchema>;
export type ListStorageItemsQuery = z.output<typeof ListStorageItemsQuerySchema>;
export type ListStorageItemsQueryInput = z.input<typeof ListStorageItemsQuerySchema>;
export type ListStorageItemsResponse = z.infer<typeof ListStorageItemsResponseSchema>;
