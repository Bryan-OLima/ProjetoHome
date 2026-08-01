import { describe, expect, it } from "vitest";
import { createToolRegistry } from "../src/tools/registry.js";
import { createMathTool, InvalidMathExpressionError } from "../src/tools/math-tool.js";

const context = {
  requestId: "6a6818be-90b0-43e9-8391-b3efe3d3f094",
  correlationId: "b66aa9b5-3187-40c6-94e9-ca080618b1c7",
};

describe("math.evaluate tool", () => {
  it("evaluates bounded arithmetic without external access", async () => {
    const registry = createToolRegistry({ tools: [createMathTool()], logger: { log() {} } });

    await expect(registry.execute("math.evaluate", { expression: "(2 + 3) * 4 - 1" }, context))
      .resolves.toEqual({ expression: "(2 + 3) * 4 - 1", value: 19 });
  });

  it("rejects expressions outside the arithmetic grammar", async () => {
    const registry = createToolRegistry({ tools: [createMathTool()], logger: { log() {} } });

    await expect(registry.execute("math.evaluate", { expression: "process.exit()" }, context))
      .rejects.toBeInstanceOf(InvalidMathExpressionError);
    await expect(registry.execute("math.evaluate", { expression: "10 / 0" }, context))
      .rejects.toBeInstanceOf(InvalidMathExpressionError);
  });
});
