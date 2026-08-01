import { z } from "zod";

const LocalAIMessageSchema = z
  .object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1),
  })
  .strict();
const LocalAIRequestSchema = z
  .object({
    messages: z.array(LocalAIMessageSchema).min(1).max(4),
    maxTokens: z.number().int().positive().optional(),
  })
  .strict();
const ChatCompletionResponseSchema = z.object({
  choices: z.array(
    z.object({ message: z.object({ content: z.string().min(1) }) }),
  ).min(1),
});

export interface LocalAIService {
  generate(request: LocalAIRequest): Promise<LocalAIResponse>;
}

export interface LocalAIRequest {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  maxTokens?: number;
}

export interface LocalAIResponse {
  content: string;
}

export class InvalidLocalAIRequestError extends Error {
  constructor() {
    super("invalid_local_ai_request");
  }
}

export class LocalAIUnavailableError extends Error {
  constructor() {
    super("local_ai_unavailable");
  }
}

export class LocalAITimeoutError extends Error {
  constructor() {
    super("local_ai_timeout");
  }
}

export class InvalidLocalAIResponseError extends Error {
  constructor() {
    super("invalid_local_ai_response");
  }
}

export function createLocalAIService(dependencies: {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxInputChars: number;
  maxOutputTokens: number;
  fetch?: typeof fetch;
}): LocalAIService {
  const endpoint = createLocalEndpoint(dependencies.baseUrl);
  const fetchImplementation = dependencies.fetch ?? fetch;

  return {
    async generate(request) {
      const parsedRequest = LocalAIRequestSchema.safeParse(request);
      if (!parsedRequest.success || exceedsInputLimit(parsedRequest.data.messages, dependencies.maxInputChars)) {
        throw new InvalidLocalAIRequestError();
      }
      const maxTokens = parsedRequest.data.maxTokens ?? dependencies.maxOutputTokens;
      if (maxTokens > dependencies.maxOutputTokens) throw new InvalidLocalAIRequestError();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), dependencies.timeoutMs);
      try {
        const response = await fetchImplementation(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model: dependencies.model,
            messages: parsedRequest.data.messages,
            max_tokens: maxTokens,
            temperature: 0,
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new LocalAIUnavailableError();

        const payload = await readJson(response, maxResponseBytes(maxTokens));
        const parsedResponse = ChatCompletionResponseSchema.safeParse(payload);
        const firstChoice = parsedResponse.success ? parsedResponse.data.choices[0] : undefined;
        if (!firstChoice || firstChoice.message.content.length > maxOutputChars(maxTokens)) {
          throw new InvalidLocalAIResponseError();
        }
        return { content: firstChoice.message.content };
      } catch (error) {
        if (controller.signal.aborted) throw new LocalAITimeoutError();
        if (
          error instanceof LocalAIUnavailableError ||
          error instanceof InvalidLocalAIResponseError
        ) {
          throw error;
        }
        throw new LocalAIUnavailableError();
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

function createLocalEndpoint(baseUrl: string): string {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error("invalid_local_ai_url");
  }
  if (url.protocol !== "http:" || url.hostname !== "127.0.0.1") {
    throw new Error("local_ai_must_use_loopback");
  }
  return new URL("/v1/chat/completions", url).toString();
}

function exceedsInputLimit(
  messages: ReadonlyArray<{ content: string }>,
  maxInputChars: number,
): boolean {
  return messages.reduce((total, message) => total + message.content.length, 0) > maxInputChars;
}

async function readJson(response: Response, maxBytes: number): Promise<unknown> {
  if (!response.body) throw new InvalidLocalAIResponseError();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) throw new InvalidLocalAIResponseError();
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  try {
    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
  } catch {
    throw new InvalidLocalAIResponseError();
  }
}

function maxOutputChars(maxTokens: number): number {
  return maxTokens * 16;
}

function maxResponseBytes(maxTokens: number): number {
  return maxOutputChars(maxTokens) + 8 * 1024;
}
