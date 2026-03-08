import { describe, it, expect } from "vitest";
import { parseDTCG } from "../src/parser/dtcg.js";

describe("DTCG Parser", () => {
  it("parses flat tokens with $value", () => {
    const result = parseDTCG({
      spacing: {
        $type: "dimension",
        sm: { $value: "8px" },
      },
    });

    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].path).toBe("spacing.sm");
    expect(result.tokens[0].value).toBe("8px");
    expect(result.tokens[0].category).toBe("spacing");
  });

  it("inherits $type from parent group", () => {
    const result = parseDTCG({
      color: {
        $type: "color",
        base: {
          blue: { $value: "#0066ff" },
        },
      },
    });

    expect(result.tokens[0].type).toBe("color");
    expect(result.tokens[0].category).toBe("color");
  });

  it("detects alias references", () => {
    const result = parseDTCG({
      color: {
        $type: "color",
        base: { blue: { $value: "#0066ff" } },
        brand: { primary: { $value: "{color.base.blue}" } },
      },
    });

    const alias = result.tokens.find((t) => t.path === "color.brand.primary");
    expect(alias?.alias).toBe("color.base.blue");
  });

  it("falls back to name-based category inference", () => {
    const result = parseDTCG({
      radius: {
        sm: { $value: "4px" },
      },
    });

    expect(result.tokens[0].category).toBe("radius");
  });

  it("preserves $description", () => {
    const result = parseDTCG({
      color: {
        $type: "color",
        surface: {
          default: {
            $value: "#f5f5f5",
            $description: "Default surface color",
          },
        },
      },
    });

    expect(result.tokens[0].description).toBe("Default surface color");
  });

  it("handles deeply nested tokens", () => {
    const result = parseDTCG({
      color: {
        $type: "color",
        theme: {
          dark: {
            surface: {
              default: { $value: "#1a1a1a" },
            },
          },
        },
      },
    });

    expect(result.tokens[0].path).toBe("color.theme.dark.surface.default");
  });
});
