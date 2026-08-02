import { SystemMetricsResponseSchema } from "@projeto-home/contracts";
import { describe, expect, it } from "vitest";
import { createCalculationResponse, createMetricsResponse } from "../src/assistant/tool-response.js";

const metrics = SystemMetricsResponseSchema.parse({
  collectedAt: "2026-08-01T12:00:00.000Z",
  serverUptimeSeconds: 817,
  memory: {
    totalBytes: { status: "available", value: 5.5 * 1024 ** 3 },
    availableBytes: { status: "available", value: 2.17 * 1024 ** 3 },
  },
  swap: {
    totalBytes: { status: "available", value: 4 * 1024 ** 3 },
    usedBytes: { status: "available", value: 2.42 * 1024 ** 3 },
  },
  storage: {
    totalBytes: { status: "available", value: 107.2 * 1024 ** 3 },
    availableBytes: { status: "available", value: 67.4 * 1024 ** 3 },
  },
  temperatures: {
    cpuCelsius: { status: "available", value: 36.8 },
    batteryCelsius: { status: "unavailable" },
  },
});

describe("assistant tool responses", () => {
  it("formats storage values in gigabytes without asking the model to convert bytes", () => {
    expect(createMetricsResponse("Quanto de armazenamento dispon\u00edvel tem?", metrics))
      .toBe("Dados atuais do servidor: Armazenamento dispon\u00edvel: 67.4 GB de 107.2 GB.");
  });

  it("marks unavailable temperatures instead of estimating them", () => {
    expect(createMetricsResponse("Como est\u00e1 a temperatura da bateria?", metrics))
      .toBe("Dados atuais do servidor: Temperatura da bateria: indispon\u00edvel.");
  });

  it("formats local calculations deterministically", () => {
    expect(createCalculationResponse({ expression: "127 * 43", value: 5461 }))
      .toBe("O resultado de 127 * 43 \u00e9 5.461.");
  });
});
