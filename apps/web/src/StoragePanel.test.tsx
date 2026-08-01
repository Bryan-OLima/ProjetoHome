import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoragePanel } from "./StoragePanel.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("StoragePanel", () => {
  it("shows capacity for the authorized internal root", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        locations: [{
          id: "internal",
          label: "Armazenamento interno",
          status: "available",
          totalBytes: { status: "available", value: 100 * 1024 ** 3 },
          usedBytes: { status: "available", value: 35 * 1024 ** 3 },
          availableBytes: { status: "available", value: 65 * 1024 ** 3 },
        }],
      }),
    }));

    render(<StoragePanel />);

    expect(await screen.findByText("65.0 GB")).toBeInTheDocument();
    expect(screen.getByText("35.0 GB")).toBeInTheDocument();
  });

  it("shows the unavailable state after a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    render(<StoragePanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Armazenamento indisponível");
  });
});
