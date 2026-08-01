import {
  MathEvaluationRequestSchema,
  MathEvaluationResultSchema,
} from "@projeto-home/contracts";
import { defineTool } from "./registry.js";

export function createMathTool() {
  return defineTool({
    name: "math.evaluate",
    description: "Evaluates a bounded arithmetic expression without external access.",
    permission: "math.evaluate",
    timeoutMs: 100,
    inputSchema: MathEvaluationRequestSchema,
    outputSchema: MathEvaluationResultSchema,
    async execute(input) {
      return { expression: input.expression, value: evaluateExpression(input.expression) };
    },
  });
}

export class InvalidMathExpressionError extends Error {
  constructor() {
    super("invalid_math_expression");
  }
}

function evaluateExpression(expression: string): number {
  const parser = new ExpressionParser(expression);
  const value = parser.parse();
  if (!Number.isFinite(value) || Math.abs(value) > 1e15) {
    throw new InvalidMathExpressionError();
  }
  return value;
}

class ExpressionParser {
  private index = 0;

  constructor(private readonly source: string) {}

  parse(): number {
    const value = this.parseSum();
    this.skipWhitespace();
    if (this.index !== this.source.length) throw new InvalidMathExpressionError();
    return value;
  }

  private parseSum(): number {
    let value = this.parseProduct();
    while (true) {
      this.skipWhitespace();
      const operator = this.source[this.index];
      if (operator !== "+" && operator !== "-") return value;
      this.index += 1;
      const right = this.parseProduct();
      value = operator === "+" ? value + right : value - right;
    }
  }

  private parseProduct(): number {
    let value = this.parseFactor();
    while (true) {
      this.skipWhitespace();
      const operator = this.source[this.index];
      if (operator !== "*" && operator !== "/" && operator !== "%") return value;
      this.index += 1;
      const right = this.parseFactor();
      if ((operator === "/" || operator === "%") && right === 0) {
        throw new InvalidMathExpressionError();
      }
      value = operator === "*" ? value * right : operator === "/" ? value / right : value % right;
    }
  }

  private parseFactor(): number {
    this.skipWhitespace();
    const operator = this.source[this.index];
    if (operator === "+" || operator === "-") {
      this.index += 1;
      const value = this.parseFactor();
      return operator === "-" ? -value : value;
    }
    if (operator === "(") {
      this.index += 1;
      const value = this.parseSum();
      this.skipWhitespace();
      if (this.source[this.index] !== ")") throw new InvalidMathExpressionError();
      this.index += 1;
      return value;
    }
    return this.parseNumber();
  }

  private parseNumber(): number {
    this.skipWhitespace();
    const remaining = this.source.slice(this.index);
    const match = /^(?:\d+(?:\.\d+)?|\.\d+)/.exec(remaining);
    if (!match) throw new InvalidMathExpressionError();
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new InvalidMathExpressionError();
    return value;
  }

  private skipWhitespace() {
    while (/\s/.test(this.source[this.index] ?? "")) this.index += 1;
  }
}
