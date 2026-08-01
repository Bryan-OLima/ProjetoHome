import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SystemMetricsPanel } from "./SystemMetricsPanel.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SystemMetricsPanel", () => {
  it("shows available and unavailable metrics", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        collectedAt: "2026-07-28T12:00:00.000Z",
        serverUptimeSeconds: 42,
        memory: { totalBytes: { status: "available", value: 6 * 1024 ** 3 }, availableBytes: { status: "available", value: 2 * 1024 ** 3 } },
        swap: { totalBytes: { status: "available", value: 4 * 1024 ** 3 }, usedBytes: { status: "available", value: 1 * 1024 ** 3 } },
        storage: { totalBytes: { status: "available", value: 112 * 1024 ** 3 }, availableBytes: { status: "available", value: 73 * 1024 ** 3 } },
        temperatures: { cpuCelsius: { status: "available", value: 36.8 }, batteryCelsius: { status: "unavailable" } },
      }),
    }));
    render(<SystemMetricsPanel />);
    expect(await screen.findByText("42 s")).toBeInTheDocument();
    expect(screen.getByText("2.0 GB")).toBeInTheDocument();
    expect(screen.getByText("36.8 °C")).toBeInTheDocument();
    expect(screen.getByText("Indisponível")).toBeInTheDocument();
    expect(screen.getByText("Nenhum alerta com as métricas disponíveis.")).toBeInTheDocument();
  });

  it("shows alerts when a configured threshold is crossed", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        collectedAt: "2026-07-28T12:00:00.000Z",
        serverUptimeSeconds: 42,
        memory: { totalBytes: { status: "available", value: 6 * 1024 ** 3 }, availableBytes: { status: "available", value: 0.5 * 1024 ** 3 } },
        swap: { totalBytes: { status: "available", value: 4 * 1024 ** 3 }, usedBytes: { status: "available", value: 3.5 * 1024 ** 3 } },
        storage: { totalBytes: { status: "available", value: 100 * 1024 ** 3 }, availableBytes: { status: "available", value: 9 * 1024 ** 3 } },
        temperatures: { cpuCelsius: { status: "available", value: 45 }, batteryCelsius: { status: "available", value: 46 } },
      }),
    }));

    render(<SystemMetricsPanel />);

    expect(await screen.findByText("Memória disponível abaixo de 15%.")).toBeInTheDocument();
    expect(screen.getByText("Swap usada acima de 75%.")).toBeInTheDocument();
    expect(screen.getByText("Armazenamento disponível abaixo de 10%.")).toBeInTheDocument();
    expect(screen.getByText("Temperatura da CPU a partir de 45 °C.")).toBeInTheDocument();
    expect(screen.getByText("Temperatura da bateria a partir de 45 °C.")).toBeInTheDocument();
  });

  it("shows an unavailable state after a request failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    render(<SystemMetricsPanel />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Métricas indisponíveis");
  });

  it("shows an error state after an API failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    render(<SystemMetricsPanel />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar as métricas");
  });
});
