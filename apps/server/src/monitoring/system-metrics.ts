import type { NumericMetric, SystemMetricsResponse } from "@projeto-home/contracts";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readdir, readFile, statfs } from "node:fs/promises";
import { freemem, totalmem } from "node:os";

const execFileAsync = promisify(execFile);
const KIB = 1024;
const unavailable: NumericMetric = { status: "unavailable" };

export interface SystemMetricsCollector {
  collect(): Promise<SystemMetricsResponse>;
}

export function createSystemMetricsCollector(dependencies?: {
  now?: () => Date;
  uptime?: () => number;
  storagePath?: string;
}): SystemMetricsCollector {
  const now = dependencies?.now ?? (() => new Date());
  const uptime = dependencies?.uptime ?? (() => process.uptime());
  const storagePath = dependencies?.storagePath ?? ".";

  return {
    async collect() {
      const [memory, storage, temperatures] = await Promise.all([
        readMemoryMetrics(),
        readStorageMetrics(storagePath),
        readThermalMetrics(),
      ]);
      const { swap, ...memoryMetrics } = memory;
      return {
        collectedAt: now().toISOString(),
        serverUptimeSeconds: uptime(),
        memory: memoryMetrics,
        swap,
        storage,
        temperatures,
      };
    },
  };
}

async function readMemoryMetrics(): Promise<{
  totalBytes: NumericMetric;
  availableBytes: NumericMetric;
  swap: { totalBytes: NumericMetric; usedBytes: NumericMetric };
}> {
  try {
    const { stdout } = await execFileAsync("free", ["-k"], {
      timeout: 1_000,
      maxBuffer: 16 * 1024,
    });
    const rows = stdout.trim().split("\n").map((line) => line.trim().split(/\s+/));
    const memory = rows.find(([name]) => name === "Mem:");
    const swap = rows.find(([name]) => name === "Swap:");
    if (!memory || !swap) throw new Error("free_output_invalid");
    const memoryValues = memory.slice(1).map(Number);
    const swapValues = swap.slice(1).map(Number);
    const total = memoryValues[0] ?? Number.NaN;
    const available = memoryValues[5] ?? Number.NaN;
    const swapTotal = swapValues[0] ?? Number.NaN;
    const swapUsed = swapValues[1] ?? Number.NaN;
    if (![total, available, swapTotal, swapUsed].every(Number.isFinite)) {
      throw new Error("free_output_invalid");
    }
    return {
      totalBytes: availableMetric(total * KIB),
      availableBytes: availableMetric(available * KIB),
      swap: { totalBytes: availableMetric(swapTotal * KIB), usedBytes: availableMetric(swapUsed * KIB) },
    };
  } catch {
    return {
      totalBytes: availableMetric(totalmem()),
      availableBytes: availableMetric(freemem()),
      swap: { totalBytes: unavailable, usedBytes: unavailable },
    };
  }
}

async function readStorageMetrics(path: string) {
  try {
    const stats = await statfs(path);
    const totalBytes = Number(stats.blocks) * Number(stats.bsize);
    const availableBytes = Number(stats.bavail) * Number(stats.bsize);
    return { totalBytes: availableMetric(totalBytes), availableBytes: availableMetric(availableBytes) };
  } catch {
    return { totalBytes: unavailable, availableBytes: unavailable };
  }
}

async function readThermalMetrics() {
  try {
    const zones = await readdir("/sys/class/thermal", { withFileTypes: true });
    const readings: Array<{ type: string; celsius: number | undefined } | undefined> = [];
    for (const zone of zones) {
      if (!zone.isDirectory() || !zone.name.startsWith("thermal_zone")) continue;
      const root = `/sys/class/thermal/${zone.name}`;
      try {
        const type = await readFile(`${root}/type`, "utf8");
        const rawTemperature = await readFile(`${root}/temp`, "utf8");
        readings.push({ type: type.trim(), celsius: normalizeTemperature(Number(rawTemperature.trim())) });
      } catch {
        readings.push(undefined);
      }
    }
    const valid = readings.filter(
      (reading): reading is { type: string; celsius: number } =>
        reading !== undefined && reading.celsius !== undefined,
    );
    const cpu = valid.filter((reading) => /^cpu-.*-usr$/.test(reading.type)).map((reading) => reading.celsius);
    const battery = valid.find((reading) => reading.type === "battery")?.celsius;
    return {
      cpuCelsius: cpu.length > 0 ? availableMetric(Math.max(...cpu)) : unavailable,
      batteryCelsius: battery === undefined ? unavailable : availableMetric(battery),
    };
  } catch {
    return { cpuCelsius: unavailable, batteryCelsius: unavailable };
  }
}

function normalizeTemperature(value: number): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  const celsius = Math.abs(value) > 200 ? value / 1_000 : value;
  return celsius >= -50 && celsius <= 150 ? celsius : undefined;
}

function availableMetric(value: number): NumericMetric {
  return Number.isFinite(value) && value >= 0 ? { status: "available", value } : unavailable;
}
