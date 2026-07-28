import { readFileSync, readdirSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createOperationalLogger,
  RotatingJsonlWriter,
} from "../src/logging/operational-logger.js";
import { sanitizeLogData } from "../src/logging/sanitize.js";

const directories: string[] = [];
afterEach(() => {
  directories.splice(0).forEach((directory) =>
    rmSync(directory, { recursive: true, force: true }),
  );
});

describe("operational logging", () => {
  it("redacts sensitive keys and secrets embedded in strings", () => {
    const sanitized = sanitizeLogData({
      password: "hunter2",
      nested: {
        token: "generic-token",
        clientSecret: "client-secret",
        accessToken: "token-value",
        detail: "Authorization: Bearer abc.def and api_key=private-key",
      },
      emailBody: "private message",
    });
    const serialized = JSON.stringify(sanitized);

    expect(serialized).not.toContain("hunter2");
    expect(serialized).not.toContain("token-value");
    expect(serialized).not.toContain("generic-token");
    expect(serialized).not.toContain("client-secret");
    expect(serialized).not.toContain("abc.def");
    expect(serialized).not.toContain("private-key");
    expect(serialized).not.toContain("private message");
    expect(serialized).toContain("[REDACTED]");
  });

  it("rotates JSONL files and retains only the configured file count", () => {
    const directory = mkdtempSync(join(tmpdir(), "projeto-home-logs-"));
    directories.push(directory);
    const writer = new RotatingJsonlWriter({
      directory,
      maxBytes: 240,
      maxFiles: 2,
    });
    const onWriteFailure = vi.fn();
    const logger = createOperationalLogger({
      writer,
      now: () => new Date("2026-07-28T12:00:00.000Z"),
      onWriteFailure,
    });

    for (let index = 0; index < 5; index += 1) {
      logger.log({
        level: "info",
        service: "test",
        action: "test.write",
        outcome: "success",
        context: { index, password: `secret-${index}` },
      });
    }

    const files = readdirSync(directory).sort();
    expect(files).toEqual(["operational.jsonl", "operational.jsonl.1"]);
    const contents = files
      .map((file) => readFileSync(join(directory, file), "utf8"))
      .join("");
    expect(contents).not.toContain("secret-");
    expect(onWriteFailure).not.toHaveBeenCalled();
    for (const line of contents.trim().split("\n")) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it("isolates a storage failure from the application flow", () => {
    const failure = new Error("disk unavailable");
    const onWriteFailure = vi.fn();
    const logger = createOperationalLogger({
      writer: {
        write() {
          throw failure;
        },
      },
      onWriteFailure,
    });

    expect(() =>
      logger.log({
        level: "error",
        service: "test",
        action: "test.failure",
        outcome: "failure",
      }),
    ).not.toThrow();
    expect(onWriteFailure).toHaveBeenCalledWith(failure);
  });
});
