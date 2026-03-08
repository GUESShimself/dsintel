import { describe, it, expect } from "vitest";
import { namingRule } from "../src/rules/naming.js";
import { ParsedToken } from "../src/parser/types.js";

function makeToken(path: string, segments?: string[]): ParsedToken {
  return {
    path,
    rawSegments: segments ?? path.split("."),
    value: "#000",
    aliases: [],
    category: "color",
  };
}

describe("Naming Rule", () => {
  it("passes valid DTCG dot-notation names", () => {
    const tokens = [
      makeToken("color.brand.primary"),
      makeToken("spacing.sm"),
      makeToken("font.size.base"),
    ];

    const issues = namingRule.run(tokens);
    expect(issues).toHaveLength(0);
  });

  it("flags camelCase segments", () => {
    const tokens = [
      makeToken("color.brandPrimary", ["color", "brandPrimary"]),
    ];

    const issues = namingRule.run(tokens);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe("naming: non-DTCG");
    expect(issues[0].suggestedFix).toContain("color.brand.primary");
  });

  it("flags kebab-case segments", () => {
    const tokens = [
      makeToken("spacing-lg", ["spacing-lg"]),
    ];

    const issues = namingRule.run(tokens);
    expect(issues).toHaveLength(1);
    expect(issues[0].suggestedFix).toContain("spacing.lg");
  });

  it("flags snake_case segments", () => {
    const tokens = [
      makeToken("font_size_lg", ["font_size_lg"]),
    ];

    const issues = namingRule.run(tokens);
    expect(issues).toHaveLength(1);
    expect(issues[0].suggestedFix).toContain("font.size.lg");
  });

  it("flags uppercase segments", () => {
    const tokens = [
      makeToken("Color.Brand", ["Color", "Brand"]),
    ];

    const issues = namingRule.run(tokens);
    expect(issues).toHaveLength(1);
  });

  it("allows single-word lowercase segments", () => {
    const tokens = [
      makeToken("color", ["color"]),
    ];

    const issues = namingRule.run(tokens);
    expect(issues).toHaveLength(0);
  });

  it("allows alphanumeric segments like 'sm' and 'h1'", () => {
    const tokens = [
      makeToken("font.size.h1", ["font", "size", "h1"]),
      makeToken("spacing.x2", ["spacing", "x2"]),
    ];

    const issues = namingRule.run(tokens);
    expect(issues).toHaveLength(0);
  });
});
