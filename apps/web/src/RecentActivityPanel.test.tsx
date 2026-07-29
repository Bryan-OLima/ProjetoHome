import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecentActivityPanel } from "./RecentActivityPanel.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RecentActivityPanel", () => {
  it("shows the latest operational events", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          {
            timestamp: "2026-07-28T12:00:00.000Z",
            level: "info",
            service: "http",
            action: "http.request",
            outcome: "success",
          },
        ],
        truncated: false,
      }),
    }));

    render(<RecentActivityPanel />);

    expect(await screen.findByText("http.request")).toBeInTheDocument();
    expect(screen.getByText("http")).toBeInTheDocument();
    expect(screen.getByText("info")).toBeInTheDocument();
  });

  it("shows the empty state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], truncated: false }),
    }));

    render(<RecentActivityPanel />);

    expect(await screen.findByText("Nenhum evento operacional recente.")).toBeInTheDocument();
  });

  it("shows an unavailable state after a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    render(<RecentActivityPanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Atividade recente indisponível");
  });
});
