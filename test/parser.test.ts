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

  it("preserves $extensions as extensions field", () => {
    const result = parseDTCG({
      color: {
        $type: "color",
        brand: {
          primary: {
            $value: "#0066ff",
            $extensions: {
              "com.figma": { scopes: ["ALL_FILLS"] },
            },
          },
        },
      },
    });

    expect(result.tokens[0].extensions).toEqual({
      "com.figma": { scopes: ["ALL_FILLS"] },
    });
  });

  it("omits extensions when $extensions is absent", () => {
    const result = parseDTCG({
      color: { $type: "color", base: { $value: "#fff" } },
    });

    expect(result.tokens[0].extensions).toBeUndefined();
  });

  it("normalizes object-format dimension value to string", () => {
    const result = parseDTCG({
      spacing: {
        md: { $value: { value: 16, unit: "px" }, $type: "dimension" },
      },
    });

    expect(result.tokens[0].value).toBe("16px");
  });

  it("normalizes object-format duration value to string", () => {
    const result = parseDTCG({
      motion: {
        fast: { $value: { value: 200, unit: "ms" }, $type: "duration" },
      },
    });

    expect(result.tokens[0].value).toBe("200ms");
  });

  it("leaves non-dimension object values untouched", () => {
    const result = parseDTCG({
      shadow: {
        md: {
          $value: { offsetX: "0", offsetY: "4px", blur: "8px", color: "#000" },
          $type: "shadow",
        },
      },
    });

    expect(result.tokens[0].value).toEqual({
      offsetX: "0",
      offsetY: "4px",
      blur: "8px",
      color: "#000",
    });
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
