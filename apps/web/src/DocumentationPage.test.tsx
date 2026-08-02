import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DocumentationPage } from "./DocumentationPage.js";

afterEach(cleanup);

describe("DocumentationPage", () => {
  it("lists the public API routes without internal tools", () => {
    render(<DocumentationPage />);
    expect(screen.getByRole("heading", { name: "Documentacao" })).toBeInTheDocument();
    expect(screen.getByText("/api/assistant/query")).toBeInTheDocument();
    expect(screen.getByText("/api/monitoring/metrics")).toBeInTheDocument();
    expect(screen.queryByText("system.get_metrics")).not.toBeInTheDocument();
  });
});
