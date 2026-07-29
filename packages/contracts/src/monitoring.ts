import { z } from "zod";

const AvailableMetricSchema = z
  .object({ status: z.literal("available"), value: z.number().finite().nonnegative() })
  .strict();
const UnavailableMetricSchema = z.object({ status: z.literal("unavailable") }).strict();
export const NumericMetricSchema = z.discriminatedUnion("status", [
  AvailableMetricSchema,
  UnavailableMetricSchema,
]);

export const SystemMetricsResponseSchema = z
  .object({
    collectedAt: z.string().datetime(),
    serverUptimeSeconds: z.number().finite().nonnegative(),
    memory: z
      .object({ totalBytes: NumericMetricSchema, availableBytes: NumericMetricSchema })
      .strict(),
    swap: z
      .object({ totalBytes: NumericMetricSchema, usedBytes: NumericMetricSchema })
      .strict(),
    storage: z
      .object({ totalBytes: NumericMetricSchema, availableBytes: NumericMetricSchema })
      .strict(),
    temperatures: z
      .object({ cpuCelsius: NumericMetricSchema, batteryCelsius: NumericMetricSchema })
      .strict(),
  })
  .strict();

export type NumericMetric = z.infer<typeof NumericMetricSchema>;
export type SystemMetricsResponse = z.infer<typeof SystemMetricsResponseSchema>;
