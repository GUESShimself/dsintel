import { describe, it, expect } from "vitest";
import { namingRule, createNamingRule } from "../src/rules/naming.js";

const lowercaseRule = createNamingRule({ enabled: true, severity: "error", convention: "lowercase" });
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

  it("flags camelCase segments when convention is configured", () => {
    const tokens = [
      makeToken("color.brandPrimary", ["color", "brandPrimary"]),
    ];

    const issues = lowercaseRule.run(tokens);
    expect(issues).toHaveLength(1);
    expect(issues[0].issueType).toBe("naming: convention");
    expect(issues[0].suggestedFix).toContain("color.brand primary");
  });

  it("does not flag camelCase by default (no convention configured)", () => {
    const tokens = [
      makeToken("color.brandPrimary", ["color", "brandPrimary"]),
    ];

    const issues = namingRule.run(tokens);
    expect(issues).toHaveLength(0);
  });

  it("flags kebab-case segments when convention is configured", () => {
    const tokens = [
      makeToken("spacing-lg", ["spacing-lg"]),
    ];

    const issues = lowercaseRule.run(tokens);
    expect(issues).toHaveLength(1);
    expect(issues[0].suggestedFix).toContain("spacing lg");
  });

  it("flags snake_case segments when convention is configured", () => {
    const tokens = [
      makeToken("font_size_lg", ["font_size_lg"]),
    ];

    const issues = lowercaseRule.run(tokens);
    expect(issues).toHaveLength(1);
    expect(issues[0].suggestedFix).toContain("font size lg");
  });

  it("flags uppercase segments when convention is configured", () => {
    const tokens = [
      makeToken("Color.Brand", ["Color", "Brand"]),
    ];

    const issues = lowercaseRule.run(tokens);
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

  it("allows space-separated lowercase names", () => {
    const tokens = [
      makeToken("brand.color.acid green", ["brand", "color", "acid green"]),
      makeToken("brand.color.hot pink", ["brand", "color", "hot pink"]),
    ];

    const issues = namingRule.run(tokens);
    expect(issues).toHaveLength(0);
  });
});
