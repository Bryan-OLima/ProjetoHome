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
