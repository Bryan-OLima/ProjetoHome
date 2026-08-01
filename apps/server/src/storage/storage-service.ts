import type {
  NumericMetric,
  ListStorageItemsResponse,
  StorageItem,
  StorageSummaryResponse,
} from "@projeto-home/contracts";
import { lstat, mkdir, readdir, statfs } from "node:fs/promises";
import { join } from "node:path";

const unavailable: NumericMetric = { status: "unavailable" };

export interface StorageService {
  getSummary(): Promise<StorageSummaryResponse>;
  listItems(limit: number): Promise<ListStorageItemsResponse>;
}

export function createStorageService(dependencies: { internalRoot: string }): StorageService {
  return {
    async getSummary() {
      try {
        await mkdir(dependencies.internalRoot, { recursive: true });
        const stats = await statfs(dependencies.internalRoot);
        const blockSize = Number(stats.bsize);
        const totalBytes = Number(stats.blocks) * blockSize;
        const usedBytes = (Number(stats.blocks) - Number(stats.bfree)) * blockSize;
        const availableBytes = Number(stats.bavail) * blockSize;
        return {
          locations: [{
            id: "internal",
            label: "Armazenamento interno",
            status: "available",
            totalBytes: metric(totalBytes),
            usedBytes: metric(usedBytes),
            availableBytes: metric(availableBytes),
          }],
        };
      } catch {
        return {
          locations: [{
            id: "internal",
            label: "Armazenamento interno",
            status: "unavailable",
            totalBytes: unavailable,
            usedBytes: unavailable,
            availableBytes: unavailable,
          }],
        };
      }
    },
    async listItems(limit) {
      await mkdir(dependencies.internalRoot, { recursive: true });
      const entries = await readdir(dependencies.internalRoot, { withFileTypes: true });
      const sorted = entries.toSorted((left, right) => left.name.localeCompare(right.name));
      const selected = sorted.slice(0, limit);
      const items = await Promise.all(selected.map(async (entry) => {
        const metadata = await lstat(join(dependencies.internalRoot, entry.name));
        return {
          name: entry.name,
          kind: getItemKind(entry),
          sizeBytes: metadata.size,
          modifiedAt: metadata.mtime.toISOString(),
        };
      }));
      return { items, truncated: entries.length > selected.length };
    },
  };
}

function getItemKind(entry: { isFile(): boolean; isDirectory(): boolean; isSymbolicLink(): boolean }): StorageItem["kind"] {
  if (entry.isFile()) return "file";
  if (entry.isDirectory()) return "directory";
  if (entry.isSymbolicLink()) return "symlink";
  return "other";
}

function metric(value: number): NumericMetric {
  return Number.isFinite(value) && value >= 0
    ? { status: "available", value }
    : unavailable;
}
