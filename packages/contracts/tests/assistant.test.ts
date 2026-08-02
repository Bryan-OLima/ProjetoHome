import { describe, expect, it } from "vitest";
import {
  AssistantQueryRequestSchema,
  AssistantQueryResponseSchema,
} from "../src/index.js";

const identifiers = {
  requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
  correlationId: "b66aa9b5-3187-40c6-94e9-ca080618b1c7",
};

describe("assistant contracts", () => {
  it("accepts a public tool result without internal data", () => {
    expect(AssistantQueryResponseSchema.safeParse({
      kind: "tool_result",
      message: "Metricas atuais do servidor consultadas.",
      ...identifiers,
    }).success).toBe(true);
  });

  it("rejects blank and oversized queries", () => {
    expect(AssistantQueryRequestSchema.safeParse({ query: "  " }).success).toBe(false);
    expect(AssistantQueryRequestSchema.safeParse({ query: "x".repeat(4_097) }).success).toBe(false);
  });

  it("accepts a bounded general text response", () => {
    expect(AssistantQueryResponseSchema.safeParse({
      kind: "text",
      message: "Posso explicar as capacidades atuais do Projeto Home.",
      ...identifiers,
    }).success).toBe(true);
  });

  it("rejects internal tool data in a public response", () => {
    expect(AssistantQueryResponseSchema.safeParse({
      kind: "tool_result",
      message: "O resultado de 2 + 2 e 4.",
      data: { expression: "2 + 2", value: 4 },
      ...identifiers,
    }).success).toBe(false);
  });
});
