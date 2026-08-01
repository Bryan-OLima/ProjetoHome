import { describe, expect, it, vi } from "vitest";
import {
  createLocalAIService,
  InvalidLocalAIRequestError,
  InvalidLocalAIResponseError,
  LocalAITimeoutError,
  LocalAIUnavailableError,
} from "../src/assistant/local-ai-service.js";

function createService(overrides?: Partial<Parameters<typeof createLocalAIService>[0]>) {
  return createLocalAIService({
    baseUrl: "http://127.0.0.1:18080",
    model: "Qwen3-1.7B-Q4_K_M",
    timeoutMs: 100,
    maxInputChars: 100,
    maxOutputTokens: 16,
    ...overrides,
  });
}

describe("local AI service", () => {
  it("calls only the loopback llama.cpp chat completion endpoint", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: "Servidor saudável." } }],
    }), { status: 200 }));
    const service = createService({ fetch });

    await expect(service.generate({
      messages: [{ role: "user", content: "Como está o servidor?" }],
    })).resolves.toEqual({ content: "Servidor saudável." });
    expect(fetch).toHaveBeenCalledWith("http://127.0.0.1:18080/v1/chat/completions", expect.objectContaining({
      body: JSON.stringify({
        model: "Qwen3-1.7B-Q4_K_M",
        messages: [{ role: "user", content: "Como está o servidor?" }],
        max_tokens: 16,
        temperature: 0,
      }),
    }));
  });

  it("rejects oversized input before contacting the runtime", async () => {
    const fetch = vi.fn();
    const service = createService({ fetch, maxInputChars: 3 });

    await expect(service.generate({
      messages: [{ role: "user", content: "long input" }],
    })).rejects.toBeInstanceOf(InvalidLocalAIRequestError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("isolates an unavailable runtime", async () => {
    const service = createService({
      fetch: async () => new Response("offline", { status: 503 }),
    });

    await expect(service.generate({
      messages: [{ role: "user", content: "hello" }],
    })).rejects.toBeInstanceOf(LocalAIUnavailableError);
  });

  it("enforces the request timeout", async () => {
    const service = createService({
      timeoutMs: 5,
      fetch: (_input, init) => new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      }),
    });

    await expect(service.generate({
      messages: [{ role: "user", content: "hello" }],
    })).rejects.toBeInstanceOf(LocalAITimeoutError);
  });

  it("rejects a malformed or oversized runtime response", async () => {
    const malformed = createService({
      fetch: async () => new Response(JSON.stringify({ choices: [] }), { status: 200 }),
    });
    const oversized = createService({
      fetch: async () => new Response(JSON.stringify({
        choices: [{ message: { content: "x".repeat(257) } }],
      }), { status: 200 }),
    });

    await expect(malformed.generate({ messages: [{ role: "user", content: "hello" }] }))
      .rejects.toBeInstanceOf(InvalidLocalAIResponseError);
    await expect(oversized.generate({ messages: [{ role: "user", content: "hello" }] }))
      .rejects.toBeInstanceOf(InvalidLocalAIResponseError);
  });

  it("refuses a runtime outside the IPv4 loopback interface", () => {
    expect(() => createService({ baseUrl: "http://192.168.0.10:8080" }))
      .toThrow("local_ai_must_use_loopback");
  });
});
