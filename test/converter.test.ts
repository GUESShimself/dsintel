import { describe, it, expect } from "vitest";
import { convert, detectPrefix, FlatTokenFile } from "../src/converter/index.js";
import { parseDTCG } from "../src/parser/dtcg.js";

describe("detectPrefix", () => {
  it("detects triple-hyphen prefix", () => {
    const file: FlatTokenFile = {
      colors: {
        "nj-atheneumStyles---color-brand-primary": "#1c3149",
      },
    };
    expect(detectPrefix(file)).toContain("nj-atheneumStyles---");
  });

  it("detects common prefix for non-triple-hyphen keys", () => {
    const file: FlatTokenFile = {
      colors: {
        "app-colors-primary": "#1c3149",
        "app-colors-secondary": "#2a4d6e",
      },
      spacing: {
        "app-spacing-sm": "8px",
        "app-spacing-md": "16px",
      },
    };
    const prefixes = detectPrefix(file);
    expect(prefixes).toContain("app-");
  });

  it("detects both prefixes in mixed file", () => {
    const file: FlatTokenFile = {
      spacing: {
        "nj-atheneumStyles---spacing-400": "32px",
      },
      colors: {
        "nj-colors-primary": "#1c3149",
        "nj-breakpoints-mobile": "0",
      },
    };
    const prefixes = detectPrefix(file);
    expect(prefixes).toContain("nj-atheneumStyles---");
    // Short prefix detected from non-triple-hyphen keys
    expect(prefixes.some((p) => p.startsWith("nj-"))).toBe(true);
  });

  it("returns empty array for no keys", () => {
    expect(detectPrefix({})).toEqual([]);
  });
});

describe("convert", () => {
  it("wraps values in $value", () => {
    const file: FlatTokenFile = {
      spacing: { "spacing-sm": "8px", "spacing-md": "16px" },
    };
    const result = convert(file, { prefix: "" });
    const spacing = result.spacing as Record<string, unknown>;
    const sm = spacing.sm as Record<string, unknown>;
    expect(sm.$value).toBe("8px");
  });

  it("sets group-level $type from category", () => {
    const file: FlatTokenFile = {
      spacing: { "spacing-sm": "8px", "spacing-md": "16px" },
      colors: { "colors-primary": "#ff0000", "colors-secondary": "#00ff00" },
    };
    const result = convert(file, { prefix: "" });
    expect((result.spacing as Record<string, unknown>).$type).toBe("dimension");
    expect((result.colors as Record<string, unknown>).$type).toBe("color");
  });

  it("strips triple-hyphen prefix from keys", () => {
    const file: FlatTokenFile = {
      spacing: {
        "nj-atheneumStyles---spacing-sm": "8px",
        "nj-atheneumStyles---spacing-md": "16px",
      },
    };
    const result = convert(file);
    const spacing = result.spacing as Record<string, unknown>;
    expect(spacing.sm).toBeDefined();
    expect(spacing.md).toBeDefined();
  });

  it("strips short prefix and category-redundant portion", () => {
    const file: FlatTokenFile = {
      colors: {
        "nj-colors-primary": "#1c3149",
        "nj-colors-secondary": "#2a4d6e",
      },
      spacing: {
        "nj-spacing-sm": "8px",
        "nj-spacing-md": "16px",
      },
    };
    const result = convert(file);
    const colors = result.colors as Record<string, unknown>;
    expect(colors.primary).toBeDefined();
    expect(colors.secondary).toBeDefined();
  });

  it("nests hyphen-separated keys into hierarchy", () => {
    const file: FlatTokenFile = {
      "border-radius": {
        "border-radius-card-outer-standard": "16px",
        "border-radius-card-outer-image": "8px",
        "border-radius-none": "0px",
      },
    };
    const result = convert(file, { prefix: "" });
    const br = result["border-radius"] as Record<string, unknown>;
    const card = br.card as Record<string, unknown>;
    const outer = card.outer as Record<string, unknown>;
    const standard = outer.standard as Record<string, unknown>;
    expect(standard.$value).toBe("16px");
    const none = br.none as Record<string, unknown>;
    expect(none.$value).toBe("0px");
  });

  it("reassembles shadow composites", () => {
    const file: FlatTokenFile = {
      "box-shadow": {
        "box-shadow-test": "box-shadow-test-group",
        "box-shadow-test-x": "0px",
        "box-shadow-test-y": "4px",
        "box-shadow-test-blur": "10px",
        "box-shadow-test-spread": "2px",
        "box-shadow-test-color": "#0000003d",
        "box-shadow-test-type": "dropShadow",
        "box-shadow-other": "box-shadow-other-group",
        "box-shadow-other-x": "1px",
        "box-shadow-other-y": "2px",
        "box-shadow-other-blur": "3px",
        "box-shadow-other-spread": "0px",
        "box-shadow-other-color": "#000000",
        "box-shadow-other-type": "dropShadow",
      },
    };
    const result = convert(file, { prefix: "" });
    const bs = result["box-shadow"] as Record<string, unknown>;
    expect(bs.$type).toBe("shadow");
    const test = bs.test as Record<string, unknown>;
    const val = test.$value as Record<string, unknown>;
    expect(val.offsetX).toBe("0px");
    expect(val.offsetY).toBe("4px");
    expect(val.blur).toBe("10px");
    expect(val.spread).toBe("2px");
    expect(val.color).toBe("#0000003d");
  });

  it("reassembles typography composites", () => {
    const file: FlatTokenFile = {
      "typography-composites": {
        "typography-composites-body-standard": "typography-composites-body-standard-group",
        "typography-composites-body-standard-font-family": "Inter",
        "typography-composites-body-standard-font-weight": "400",
        "typography-composites-body-standard-line-height": "24px",
        "typography-composites-body-standard-font-size": "16px",
        "typography-composites-body-standard-letter-spacing": "0px",
        "typography-composites-body-large": "typography-composites-body-large-group",
        "typography-composites-body-large-font-family": "Inter",
        "typography-composites-body-large-font-weight": "700",
        "typography-composites-body-large-line-height": "28px",
        "typography-composites-body-large-font-size": "20px",
        "typography-composites-body-large-letter-spacing": "0px",
      },
    };
    const result = convert(file, { prefix: "" });
    const tc = result["typography-composites"] as Record<string, unknown>;
    expect(tc.$type).toBe("typography");
    const body = tc.body as Record<string, unknown>;
    const standard = body.standard as Record<string, unknown>;
    const val = standard.$value as Record<string, unknown>;
    expect(val.fontFamily).toBe("Inter");
    expect(val.fontSize).toBe("16px");
  });

  it("normalizes opacity percentages to 0-1 numbers", () => {
    const file: FlatTokenFile = {
      opacity: { "opacity-80": "80%", "opacity-100": "100%" },
    };
    const result = convert(file, { prefix: "" });
    const opacity = result.opacity as Record<string, unknown>;
    const token = opacity["80"] as Record<string, unknown>;
    expect(token.$value).toBe(0.8);
  });

  it("normalizes unitless numbers for number-typed categories", () => {
    const file: FlatTokenFile = {
      "z-index": { "z-index-modal": "4500", "z-index-dropdown": "1000" },
    };
    const result = convert(file, { prefix: "" });
    const zi = result["z-index"] as Record<string, unknown>;
    const modal = zi.modal as Record<string, unknown>;
    expect(modal.$value).toBe(4500);
  });

  it("uses manual prefix override", () => {
    const file: FlatTokenFile = {
      colors: {
        "myapp-colors-primary": "#1c3149",
        "myapp-colors-secondary": "#2a4d6e",
      },
    };
    const result = convert(file, { prefix: "myapp-" });
    const colors = result.colors as Record<string, unknown>;
    expect(colors.primary).toBeDefined();
  });

  it("produces output parseable by DTCG parser", () => {
    const file: FlatTokenFile = {
      colors: {
        "colors-primary": "#1c3149",
        "colors-secondary": "#2a4d6e",
      },
      spacing: {
        "spacing-sm": "8px",
        "spacing-md": "16px",
      },
    };
    const result = convert(file, { prefix: "" });

    const parsed = parseDTCG(result as Record<string, unknown>);
    expect(parsed.tokens.length).toBeGreaterThan(0);

    const colorTokens = parsed.tokens.filter((t) => t.category === "color");
    expect(colorTokens.length).toBe(2);

    const spacingTokens = parsed.tokens.filter(
      (t) => t.category === "spacing",
    );
    expect(spacingTokens.length).toBe(2);
  });
});
