import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistantPanel } from "./AssistantPanel.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AssistantPanel", () => {
  it("submits a natural-language query and shows the structured result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        kind: "tool_result",
        message: "Métricas atuais do servidor consultadas.",
        tool: "system.get_metrics",
        data: {
          collectedAt: "2026-08-01T12:00:00.000Z",
          serverUptimeSeconds: 42,
          memory: { totalBytes: { status: "available", value: 100 }, availableBytes: { status: "available", value: 50 } },
          swap: { totalBytes: { status: "unavailable" }, usedBytes: { status: "unavailable" } },
          storage: { totalBytes: { status: "available", value: 100 }, availableBytes: { status: "available", value: 50 } },
          temperatures: { cpuCelsius: { status: "available", value: 36 }, batteryCelsius: { status: "unavailable" } },
        },
        requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
        correlationId: "b66aa9b5-3187-40c6-94e9-ca080618b1c7",
      }),
    }));

    render(<AssistantPanel />);
    fireEvent.change(screen.getByLabelText("Consulta"), { target: { value: "Como está o servidor?" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    expect(await screen.findByText("Métricas atuais do servidor consultadas.")).toBeInTheDocument();
    expect(screen.getByText("Dados consultados (system.get_metrics)")).toBeInTheDocument();
  });

  it("shows a safe unavailable state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<AssistantPanel />);
    fireEvent.change(screen.getByLabelText("Consulta"), { target: { value: "Como está o servidor?" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A IA local");
  });
});
