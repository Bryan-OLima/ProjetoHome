import { z } from "zod";

const ConfigSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_PATH: z.string().min(1).default("./data/projeto-home.sqlite"),
  LOG_DIRECTORY: z.string().min(1).default("./var/log"),
  LOG_MAX_BYTES: z.coerce.number().int().min(1).default(5 * 1024 * 1024),
  LOG_MAX_FILES: z.coerce.number().int().min(1).max(30).default(7),
  AUDIT_RETENTION_DAYS: z.coerce.number().int().min(1).max(3_650).default(365),
  ERROR_RETENTION_DAYS: z.coerce.number().int().min(1).max(3_650).default(90),
  EVENT_RETENTION_BATCH_SIZE: z.coerce.number().int().min(1).max(5_000).default(500),
});

export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  databasePath: string;
  logDirectory: string;
  logMaxBytes: number;
  logMaxFiles: number;
  auditRetentionDays: number;
  errorRetentionDays: number;
  eventRetentionBatchSize: number;
}

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AppConfig {
  const parsed = ConfigSchema.parse(environment);

  return {
    nodeEnv: parsed.NODE_ENV,
    host: parsed.HOST,
    port: parsed.PORT,
    databasePath: parsed.DATABASE_PATH,
    logDirectory: parsed.LOG_DIRECTORY,
    logMaxBytes: parsed.LOG_MAX_BYTES,
    logMaxFiles: parsed.LOG_MAX_FILES,
    auditRetentionDays: parsed.AUDIT_RETENTION_DAYS,
    errorRetentionDays: parsed.ERROR_RETENTION_DAYS,
    eventRetentionBatchSize: parsed.EVENT_RETENTION_BATCH_SIZE,
  };
}
