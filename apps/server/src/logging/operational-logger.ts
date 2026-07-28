import {
  OperationalLogEventSchema,
  type LogLevel,
  type LogOutcome,
  type OperationalLogEvent,
} from "@projeto-home/contracts";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { sanitizeLogData } from "./sanitize.js";

export interface OperationalLogInput {
  level: LogLevel;
  service: string;
  action: string;
  outcome: LogOutcome;
  requestId?: string;
  correlationId?: string;
  durationMs?: number;
  errorCode?: string;
  message?: string;
  context?: Record<string, unknown>;
}

export interface OperationalLogger {
  log(event: OperationalLogInput): void;
}

export interface JsonlWriterOptions {
  directory: string;
  maxBytes: number;
  maxFiles: number;
}

export class RotatingJsonlWriter {
  readonly activePath: string;
  private readonly directory: string;
  private readonly maxBytes: number;
  private readonly maxFiles: number;

  constructor(options: JsonlWriterOptions) {
    if (!Number.isSafeInteger(options.maxBytes) || options.maxBytes < 1) {
      throw new Error("log_max_bytes_must_be_a_positive_integer");
    }
    if (!Number.isSafeInteger(options.maxFiles) || options.maxFiles < 1) {
      throw new Error("log_max_files_must_be_a_positive_integer");
    }

    this.directory = resolve(options.directory);
    this.activePath = join(this.directory, "operational.jsonl");
    this.maxBytes = options.maxBytes;
    this.maxFiles = options.maxFiles;
    mkdirSync(this.directory, { recursive: true });
  }

  write(event: OperationalLogEvent): void {
    const line = `${JSON.stringify(event)}\n`;
    const lineBytes = Buffer.byteLength(line);
    const currentBytes = existsSync(this.activePath)
      ? statSync(this.activePath).size
      : 0;

    if (currentBytes > 0 && currentBytes + lineBytes > this.maxBytes) {
      this.rotate();
    }
    appendFileSync(this.activePath, line, { encoding: "utf8", mode: 0o600 });
  }

  private rotate(): void {
    const archiveCount = this.maxFiles - 1;
    if (archiveCount === 0) {
      unlinkSync(this.activePath);
      return;
    }

    const oldestPath = `${this.activePath}.${archiveCount}`;
    if (existsSync(oldestPath)) unlinkSync(oldestPath);

    for (let index = archiveCount - 1; index >= 1; index -= 1) {
      const source = `${this.activePath}.${index}`;
      if (existsSync(source)) renameSync(source, `${this.activePath}.${index + 1}`);
    }
    renameSync(this.activePath, `${this.activePath}.1`);
  }
}

interface LoggerOptions {
  writer: Pick<RotatingJsonlWriter, "write">;
  now?: () => Date;
  onWriteFailure?: (error: unknown) => void;
  onEvent?: (event: OperationalLogEvent) => void;
  onEventFailure?: (error: unknown) => void;
}

export function createOperationalLogger(options: LoggerOptions): OperationalLogger {
  const now = options.now ?? (() => new Date());

  return {
    log(input) {
      let event: OperationalLogEvent;
      try {
        const sanitized = sanitizeLogData({
          timestamp: now().toISOString(),
          ...input,
        });
        event = OperationalLogEventSchema.parse(sanitized);
      } catch (error) {
        options.onWriteFailure?.(error);
        return;
      }

      try {
        options.writer.write(event);
      } catch (error) {
        options.onWriteFailure?.(error);
      }

      try {
        options.onEvent?.(event);
      } catch (error) {
        options.onEventFailure?.(error);
      }
    },
  };
}

export const noopOperationalLogger: OperationalLogger = { log() {} };
