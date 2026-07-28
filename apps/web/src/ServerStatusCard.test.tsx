import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServerStatusCard } from "./ServerStatusCard.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ServerStatusCard", () => {
  it("shows loading and then the validated online state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: "ok",
          version: "0.1.0",
          uptimeSeconds: 42,
          database: "ok",
          timestamp: "2026-07-28T06:00:00.000Z",
          requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
        }),
      }),
    );

    render(<ServerStatusCard />);
    expect(screen.getByText("Carregando estado…")).toBeInTheDocument();
    expect(await screen.findByText("Servidor online")).toBeInTheDocument();
    expect(screen.getByText("API 0.1.0 · banco ok")).toBeInTheDocument();
  });

  it("shows the offline state after a request failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<ServerStatusCard />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Servidor indisponível",
    );
  });
});
