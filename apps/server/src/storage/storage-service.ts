import type {
  NumericMetric,
  StorageSummaryResponse,
} from "@projeto-home/contracts";
import { mkdir, statfs } from "node:fs/promises";

const unavailable: NumericMetric = { status: "unavailable" };

export interface StorageService {
  getSummary(): Promise<StorageSummaryResponse>;
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
  };
}

function metric(value: number): NumericMetric {
  return Number.isFinite(value) && value >= 0
    ? { status: "available", value }
    : unavailable;
}
