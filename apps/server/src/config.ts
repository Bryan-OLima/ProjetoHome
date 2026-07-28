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
});

export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  databasePath: string;
  logDirectory: string;
  logMaxBytes: number;
  logMaxFiles: number;
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
  };
}
