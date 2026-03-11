import { describe, it, expect } from "vitest";
import { parseTokensStudio } from "../src/parser/tokens-studio.js";

describe("parseTokensStudio", () => {
  it("parses simple color tokens", () => {
    const json = {
      color: {
        primary: {
          value: "#ff0000",
          type: "color",
        },
        secondary: {
          value: "#00ff00",
          type: "color",
        },
      },
    };
    const result = parseTokensStudio(json);
    expect(result.format).toBe("tokens-studio");
    expect(result.tokens).toHaveLength(2);
    expect(result.tokens[0].path).toBe("color.primary");
    expect(result.tokens[0].value).toBe("#ff0000");
    expect(result.tokens[0].type).toBe("color");
    expect(result.tokens[0].category).toBe("color");
  });

  it("parses deeply nested tokens", () => {
    const json = {
      color: {
        gray: {
          100: {
            value: "#f5f5f5",
            type: "color",
            description: "WCAG: 1.03",
          },
          200: {
            value: "#eeeeee",
            type: "color",
          },
        },
      },
    };
    const result = parseTokensStudio(json);
    expect(result.tokens).toHaveLength(2);
    expect(result.tokens[0].path).toBe("color.gray.100");
    expect(result.tokens[0].description).toBe("WCAG: 1.03");
    expect(result.tokens[1].path).toBe("color.gray.200");
  });

  it("detects alias references", () => {
    const json = {
      color: {
        base: {
          value: "#0066ff",
          type: "color",
        },
        brand: {
          value: "{color.base}",
          type: "color",
        },
      },
    };
    const result = parseTokensStudio(json);
    const brand = result.tokens.find((t) => t.path === "color.brand")!;
    expect(brand.alias).toBe("color.base");
    expect(brand.aliases).toEqual(["color.base"]);
  });

  it("inherits type from parent group", () => {
    const json = {
      color: {
        type: "color",
        primary: {
          value: "#ff0000",
        },
        secondary: {
          value: "#00ff00",
        },
      },
    };
    const result = parseTokensStudio(json);
    expect(result.tokens).toHaveLength(2);
    expect(result.tokens[0].type).toBe("color");
    expect(result.tokens[1].type).toBe("color");
  });

  it("infers category from path when type is missing", () => {
    const json = {
      spacing: {
        sm: { value: "8px" },
        md: { value: "16px" },
      },
    };
    const result = parseTokensStudio(json);
    expect(result.tokens[0].category).toBe("spacing");
    expect(result.tokens[1].category).toBe("spacing");
  });

  it("maps Tokens Studio types to categories", () => {
    const json = {
      tokens: {
        radius: {
          value: "8px",
          type: "borderRadius",
        },
        weight: {
          value: "700",
          type: "fontWeights",
        },
        gap: {
          value: "16px",
          type: "spacing",
        },
      },
    };
    const result = parseTokensStudio(json);
    const radius = result.tokens.find((t) => t.path === "tokens.radius")!;
    expect(radius.category).toBe("radius");
    const weight = result.tokens.find((t) => t.path === "tokens.weight")!;
    expect(weight.category).toBe("typography");
    const gap = result.tokens.find((t) => t.path === "tokens.gap")!;
    expect(gap.category).toBe("spacing");
  });

  it("skips $themes and $metadata keys", () => {
    const json = {
      $themes: [{ name: "light" }],
      $metadata: { tokenSetOrder: ["global"] },
      color: {
        primary: {
          value: "#ff0000",
          type: "color",
        },
      },
    } as unknown as Record<string, unknown>;
    const result = parseTokensStudio(json);
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].path).toBe("color.primary");
  });

  it("handles composite shadow values", () => {
    const json = {
      shadow: {
        card: {
          value: {
            x: "0",
            y: "4",
            blur: "8",
            spread: "0",
            color: "rgba(0,0,0,0.1)",
            type: "dropShadow",
          },
          type: "boxShadow",
        },
      },
    };
    const result = parseTokensStudio(json);
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].path).toBe("shadow.card");
    const val = result.tokens[0].value as Record<string, unknown>;
    expect(val.blur).toBe("8");
  });

  it("handles composite typography values", () => {
    const json = {
      typography: {
        body: {
          value: {
            fontFamily: "Inter",
            fontWeight: "400",
            fontSize: "16",
            lineHeight: "24",
            letterSpacing: "0",
          },
          type: "typography",
        },
      },
    };
    const result = parseTokensStudio(json);
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].path).toBe("typography.body");
    expect(result.tokens[0].category).toBe("typography");
    const val = result.tokens[0].value as Record<string, unknown>;
    expect(val.fontFamily).toBe("Inter");
  });

  it("returns empty tokens for empty input", () => {
    const result = parseTokensStudio({});
    expect(result.tokens).toEqual([]);
    expect(result.format).toBe("tokens-studio");
  });

  it("collects aliases within composite values", () => {
    const json = {
      shadow: {
        card: {
          value: {
            x: "0",
            y: "4",
            blur: "8",
            spread: "0",
            color: "{color.shadow}",
          },
          type: "boxShadow",
        },
      },
    };
    const result = parseTokensStudio(json);
    expect(result.tokens[0].aliases).toEqual(["color.shadow"]);
  });
});
