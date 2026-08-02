import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistantPanel } from "./AssistantPanel.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AssistantPanel", () => {
  it("submits a natural-language query without rendering internal tool data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        kind: "tool_result",
        message: "Métricas atuais do servidor consultadas.",
        requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
        correlationId: "b66aa9b5-3187-40c6-94e9-ca080618b1c7",
      }),
    }));

    const { container } = render(<AssistantPanel />);
    fireEvent.change(screen.getByLabelText("Consulta"), { target: { value: "Como está o servidor?" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    expect(await screen.findByText("Métricas atuais do servidor consultadas.")).toBeInTheDocument();
    expect(container.querySelector("details")).not.toBeInTheDocument();
  });

  it("shows a safe unavailable state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<AssistantPanel />);
    fireEvent.change(screen.getByLabelText("Consulta"), { target: { value: "Como está o servidor?" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A IA local");
  });
});
