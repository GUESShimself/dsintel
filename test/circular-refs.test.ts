import { describe, it, expect } from "vitest";
import { circularRefsRule } from "../src/rules/circular-refs.js";
import { ParsedToken } from "../src/parser/types.js";

function makeToken(path: string, aliases: string[]): ParsedToken {
  return {
    path,
    rawSegments: path.split("."),
    value: aliases.length === 1 ? `{${aliases[0]}}` : "#000",
    aliases,
    category: "other",
  };
}

describe("Circular Refs Rule", () => {
  it("reports no issues for tokens with no aliases", () => {
    const tokens = [
      makeToken("color.primary", []),
      makeToken("color.secondary", []),
    ];
    expect(circularRefsRule.run(tokens)).toHaveLength(0);
  });

  it("reports no issues for a valid alias chain", () => {
    const tokens = [
      makeToken("color.alias", ["color.base"]),
      makeToken("color.base", []),
    ];
    expect(circularRefsRule.run(tokens)).toHaveLength(0);
  });

  it("detects a direct self-reference (a → a)", () => {
    const tokens = [makeToken("a", ["a"])];
    const issues = circularRefsRule.run(tokens);
    expect(issues).toHaveLength(1);
    expect(issues[0].token.path).toBe("a");
    expect(issues[0].severity).toBe("error");
    expect(issues[0].issueType).toBe("circular reference");
  });

  it("detects a 3-token cycle (a → b → c → a)", () => {
    const tokens = [
      makeToken("a", ["b"]),
      makeToken("b", ["c"]),
      makeToken("c", ["a"]),
    ];
    const issues = circularRefsRule.run(tokens);
    const flagged = new Set(issues.map((i) => i.token.path));
    expect(flagged).toEqual(new Set(["a", "b", "c"]));
    expect(issues.every((i) => i.severity === "error")).toBe(true);
  });

  it("only flags tokens in the cycle, not tokens that reference into it", () => {
    // d → a → b → a (cycle is a ↔ b, d is outside)
    const tokens = [
      makeToken("a", ["b"]),
      makeToken("b", ["a"]),
      makeToken("d", ["a"]),
    ];
    const issues = circularRefsRule.run(tokens);
    const flagged = new Set(issues.map((i) => i.token.path));
    expect(flagged).toEqual(new Set(["a", "b"]));
    expect(flagged.has("d")).toBe(false);
  });

  it("detects multiple independent cycles", () => {
    const tokens = [
      makeToken("a", ["b"]),
      makeToken("b", ["a"]),
      makeToken("x", ["y"]),
      makeToken("y", ["x"]),
      makeToken("z", []),
    ];
    const issues = circularRefsRule.run(tokens);
    const flagged = new Set(issues.map((i) => i.token.path));
    expect(flagged).toEqual(new Set(["a", "b", "x", "y"]));
  });
});
