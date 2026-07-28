import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LogsPage } from "./LogsPage.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function response(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => body };
}

function stubSuccessfulFetch() {
  const fetchMock = vi.fn((path: string) => {
    if (path.startsWith("/api/observability/events")) {
      return Promise.resolve(
        response({
          items: [
            {
              kind: "audit",
              id: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
              timestamp: "2026-07-28T12:00:00.000Z",
              actor: "local.admin",
              action: "settings.update",
              resourceType: "settings",
              outcome: "success",
            },
          ],
        }),
      );
    }
    return Promise.resolve(
      response({
        items: [
          {
            timestamp: "2026-07-28T12:01:00.000Z",
            level: "info",
            service: "http",
            action: "http.request",
            outcome: "success",
          },
        ],
        truncated: false,
      }),
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("LogsPage", () => {
  it("loads and displays persisted and operational events", async () => {
    stubSuccessfulFetch();

    render(<LogsPage />);

    expect(screen.getByText("Carregando logs…")).toBeInTheDocument();
    expect(await screen.findByText("settings.update")).toBeInTheDocument();
    expect(screen.getByText("http.request")).toBeInTheDocument();
    expect(screen.getByText("Eventos persistidos")).toBeInTheDocument();
    expect(screen.getByText("Logs operacionais")).toBeInTheDocument();
    expect(screen.getByText("Detalhes técnicos")).toBeInTheDocument();
    expect(screen.getAllByText("?")).toHaveLength(4);
    expect(screen.getAllByRole("tooltip")).toHaveLength(4);
    expect(screen.getByText(/Opções atuais: http, server/)).toBeInTheDocument();
  });

  it("applies the level filter and shows empty states", async () => {
    const fetchMock = vi.fn((path: string) =>
      Promise.resolve(
        response(
          path.startsWith("/api/observability/events")
            ? { items: [] }
            : { items: [], truncated: true },
        ),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<LogsPage />);

    expect(await screen.findAllByText("Nenhum evento encontrado para estes filtros.")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Nível operacional"), {
      target: { value: "warn" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("level=warn"),
        expect.anything(),
      );
    });
    expect(screen.getByText("Resultado limitado à janela segura de leitura.")).toBeInTheDocument();
  });

  it("distinguishes an unavailable server from an API failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const { unmount } = render(<LogsPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Servidor indisponível");
    unmount();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, false)));
    render(<LogsPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar os logs agora.");
  });
});
