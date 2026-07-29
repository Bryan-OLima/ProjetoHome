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
