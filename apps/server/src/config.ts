import { z } from "zod";

const ConfigSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  HOST: z.string().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_PATH: z.string().min(1).default("./data/projeto-home.sqlite"),
  STORAGE_ROOT: z.string().min(1).default("./data/storage"),
  LOG_DIRECTORY: z.string().min(1).default("./var/log"),
  LOG_MAX_BYTES: z.coerce.number().int().min(1).default(5 * 1024 * 1024),
  LOG_MAX_FILES: z.coerce.number().int().min(1).max(30).default(7),
  OPERATIONAL_LOG_QUERY_MAX_BYTES: z.coerce
    .number()
    .int()
    .min(4 * 1024)
    .max(10 * 1024 * 1024)
    .default(2 * 1024 * 1024),
  AUDIT_RETENTION_DAYS: z.coerce.number().int().min(1).max(3_650).default(365),
  ERROR_RETENTION_DAYS: z.coerce.number().int().min(1).max(3_650).default(90),
  EVENT_RETENTION_BATCH_SIZE: z.coerce.number().int().min(1).max(5_000).default(500),
  LOCAL_AI_BASE_URL: z.string().url().default("http://127.0.0.1:8080"),
  LOCAL_AI_MODEL: z.string().min(1).default("Qwen3-1.7B-Q4_K_M"),
  LOCAL_AI_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(180_000).default(60_000),
  LOCAL_AI_MAX_INPUT_CHARS: z.coerce.number().int().min(256).max(32_768).default(8_192),
  LOCAL_AI_MAX_OUTPUT_TOKENS: z.coerce.number().int().min(8).max(512).default(128),
});

export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  databasePath: string;
  storageRoot: string;
  logDirectory: string;
  logMaxBytes: number;
  logMaxFiles: number;
  operationalLogQueryMaxBytes: number;
  auditRetentionDays: number;
  errorRetentionDays: number;
  eventRetentionBatchSize: number;
  localAiBaseUrl: string;
  localAiModel: string;
  localAiTimeoutMs: number;
  localAiMaxInputChars: number;
  localAiMaxOutputTokens: number;
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
    storageRoot: parsed.STORAGE_ROOT,
    logDirectory: parsed.LOG_DIRECTORY,
    logMaxBytes: parsed.LOG_MAX_BYTES,
    logMaxFiles: parsed.LOG_MAX_FILES,
    operationalLogQueryMaxBytes: parsed.OPERATIONAL_LOG_QUERY_MAX_BYTES,
    auditRetentionDays: parsed.AUDIT_RETENTION_DAYS,
    errorRetentionDays: parsed.ERROR_RETENTION_DAYS,
    eventRetentionBatchSize: parsed.EVENT_RETENTION_BATCH_SIZE,
    localAiBaseUrl: parsed.LOCAL_AI_BASE_URL,
    localAiModel: parsed.LOCAL_AI_MODEL,
    localAiTimeoutMs: parsed.LOCAL_AI_TIMEOUT_MS,
    localAiMaxInputChars: parsed.LOCAL_AI_MAX_INPUT_CHARS,
    localAiMaxOutputTokens: parsed.LOCAL_AI_MAX_OUTPUT_TOKENS,
  };
}
