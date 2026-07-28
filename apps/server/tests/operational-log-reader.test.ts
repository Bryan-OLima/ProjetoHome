import { OperationalLogEventSchema } from "@projeto-home/contracts";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { JsonlOperationalLogReader } from "../src/observability/jsonl-operational-log-reader.js";

const directories: string[] = [];
afterEach(() => {
  directories.splice(0).forEach((directory) =>
    rmSync(directory, { recursive: true, force: true }),
  );
});

function event(action: string, timestamp: string, context?: Record<string, unknown>) {
  return OperationalLogEventSchema.parse({
    timestamp,
    level: "info",
    service: "http",
    action,
    outcome: "success",
    correlationId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
    context,
  });
}

describe("JsonlOperationalLogReader", () => {
  it("reads active and rotated files newest first with validated filters", () => {
    const directory = mkdtempSync(join(tmpdir(), "projeto-home-query-"));
    directories.push(directory);
    writeFileSync(
      join(directory, "operational.jsonl.1"),
      `${JSON.stringify(event("http.archive", "2026-07-28T10:00:00.000Z"))}\n`,
    );
    writeFileSync(
      join(directory, "operational.jsonl"),
      [
        event("http.current", "2026-07-28T12:00:00.000Z"),
        event("http.latest", "2026-07-28T13:00:00.000Z"),
      ]
        .map((item) => JSON.stringify(item))
        .join("\n")
        .concat("\n"),
    );
    const reader = new JsonlOperationalLogReader({
      directory,
      maxFiles: 2,
      maxScanBytes: 16 * 1024,
    });

    const page = reader.listLogs({
      action: "http.current",
      limit: 10,
    });

    expect(page).toEqual({
      items: [expect.objectContaining({ action: "http.current" })],
      truncated: false,
    });
  });

  it("sanitizes parsed records again and reports when the scan is bounded", () => {
    const directory = mkdtempSync(join(tmpdir(), "projeto-home-query-"));
    directories.push(directory);
    const entries = Array.from({ length: 10 }, (_value, index) =>
      JSON.stringify(
        event(`http.item-${index}`, `2026-07-28T12:00:0${index}.000Z`, {
          password: "must-not-leak",
          detail: "token=must-not-leak",
          padding: "x".repeat(120),
        }),
      ),
    ).join("\n");
    writeFileSync(join(directory, "operational.jsonl"), `${entries}\n`);
    const reader = new JsonlOperationalLogReader({
      directory,
      maxFiles: 1,
      maxScanBytes: 900,
    });

    const page = reader.listLogs({ limit: 10 });

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.truncated).toBe(true);
    expect(JSON.stringify(page.items)).not.toContain("must-not-leak");
    expect(JSON.stringify(page.items)).toContain("[REDACTED]");
  });
});
