import {
  OperationalLogEventSchema,
  type OperationalLogEvent,
} from "@projeto-home/contracts";
import { closeSync, existsSync, openSync, readSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { sanitizeLogData } from "../logging/sanitize.js";
import type {
  OperationalLogFilters,
  OperationalLogPage,
  OperationalLogReader,
} from "./operational-log-reader.js";

const READ_BLOCK_BYTES = 8 * 1024;

export interface JsonlOperationalLogReaderOptions {
  directory: string;
  maxFiles: number;
  maxScanBytes: number;
}

export class JsonlOperationalLogReader implements OperationalLogReader {
  private readonly directory: string;
  private readonly maxFiles: number;
  private readonly maxScanBytes: number;

  constructor(options: JsonlOperationalLogReaderOptions) {
    if (!Number.isSafeInteger(options.maxFiles) || options.maxFiles < 1) {
      throw new Error("log_max_files_must_be_a_positive_integer");
    }
    if (!Number.isSafeInteger(options.maxScanBytes) || options.maxScanBytes < 1) {
      throw new Error("operational_log_query_max_bytes_must_be_a_positive_integer");
    }

    this.directory = resolve(options.directory);
    this.maxFiles = options.maxFiles;
    this.maxScanBytes = options.maxScanBytes;
  }

  listLogs(filters: OperationalLogFilters): OperationalLogPage {
    const items: OperationalLogEvent[] = [];
    let scannedBytes = 0;
    let truncated = false;

    const processLine = (line: Buffer): boolean => {
      if (line.length === 0) return false;
      const parsedJson = this.parseLine(line);
      if (!parsedJson || !matchesFilters(parsedJson, filters)) return false;

      if (items.length >= filters.limit) {
        truncated = true;
        return true;
      }
      items.push(parsedJson);
      return false;
    };

    for (const path of this.logPaths()) {
      if (!existsSync(path)) continue;
      const result = scanFileFromEnd(path, this.maxScanBytes - scannedBytes, processLine);
      scannedBytes += result.scannedBytes;
      if (result.stopped || result.hasRemainingBytes) {
        truncated = true;
        break;
      }
    }

    return { items, truncated };
  }

  private logPaths(): string[] {
    const activePath = join(this.directory, "operational.jsonl");
    return Array.from({ length: this.maxFiles }, (_value, index) =>
      index === 0 ? activePath : `${activePath}.${index}`,
    );
  }

  private parseLine(line: Buffer): OperationalLogEvent | undefined {
    try {
      const value: unknown = JSON.parse(line.toString("utf8"));
      const parsed = OperationalLogEventSchema.safeParse(sanitizeLogData(value));
      return parsed.success ? parsed.data : undefined;
    } catch {
      return undefined;
    }
  }
}

function matchesFilters(
  event: OperationalLogEvent,
  filters: OperationalLogFilters,
): boolean {
  const timestamp = new Date(event.timestamp);
  return (
    (!filters.from || timestamp >= filters.from) &&
    (!filters.to || timestamp <= filters.to) &&
    (!filters.level || event.level === filters.level) &&
    (!filters.service || event.service === filters.service) &&
    (!filters.action || event.action === filters.action) &&
    (!filters.correlationId || event.correlationId === filters.correlationId)
  );
}

function scanFileFromEnd(
  path: string,
  byteBudget: number,
  processLine: (line: Buffer) => boolean,
): { scannedBytes: number; hasRemainingBytes: boolean; stopped: boolean } {
  if (byteBudget <= 0) {
    return { scannedBytes: 0, hasRemainingBytes: true, stopped: false };
  }

  const descriptor = openSync(path, "r");
  try {
    let position = statSync(path).size;
    let scannedBytes = 0;
    let trailing = Buffer.alloc(0);

    while (position > 0 && scannedBytes < byteBudget) {
      const bytesToRead = Math.min(READ_BLOCK_BYTES, position, byteBudget - scannedBytes);
      position -= bytesToRead;
      const block = Buffer.allocUnsafe(bytesToRead);
      const bytesRead = readSync(descriptor, block, 0, bytesToRead, position);
      scannedBytes += bytesRead;
      const content = Buffer.concat([block.subarray(0, bytesRead), trailing]);
      const lines = content.toString("binary").split("\n");
      trailing = Buffer.from(lines.shift() ?? "", "binary");

      for (let index = lines.length - 1; index >= 0; index -= 1) {
        const line = Buffer.from(lines[index] ?? "", "binary");
        if (processLine(line)) {
          return { scannedBytes, hasRemainingBytes: position > 0, stopped: true };
        }
      }
    }

    if (position === 0 && trailing.length > 0 && processLine(trailing)) {
      return { scannedBytes, hasRemainingBytes: false, stopped: true };
    }

    return { scannedBytes, hasRemainingBytes: position > 0, stopped: false };
  } finally {
    closeSync(descriptor);
  }
}
