import { describe, it, expect } from "vitest";
import { resolveConfig, DEFAULT_CONFIG } from "../src/config/index.js";

describe("resolveConfig", () => {
  it("returns defaults when given an empty config", () => {
    const resolved = resolveConfig({});
    expect(resolved).toEqual(DEFAULT_CONFIG);
  });

  it("returns defaults when given undefined", () => {
    const resolved = resolveConfig();
    expect(resolved).toEqual(DEFAULT_CONFIG);
  });

  it("overrides naming convention", () => {
    const resolved = resolveConfig({
      rules: { naming: { convention: "kebab-case" } },
    });
    expect(resolved.rules.naming.convention).toBe("kebab-case");
    // Other defaults preserved
    expect(resolved.rules.naming.enabled).toBe(true);
    expect(resolved.rules.naming.severity).toBe("error");
  });

  it("overrides semantic-drift threshold", () => {
    const resolved = resolveConfig({
      rules: { "semantic-drift": { saturationThreshold: 30 } },
    });
    expect(resolved.rules["semantic-drift"].saturationThreshold).toBe(30);
    expect(resolved.rules["semantic-drift"].neutralKeywords).toEqual(
      DEFAULT_CONFIG.rules["semantic-drift"].neutralKeywords,
    );
  });

  it("disables a rule", () => {
    const resolved = resolveConfig({
      rules: { unused: { enabled: false } },
    });
    expect(resolved.rules.unused.enabled).toBe(false);
    // Other rules still enabled
    expect(resolved.rules.naming.enabled).toBe(true);
    expect(resolved.rules["semantic-drift"].enabled).toBe(true);
  });

  it("overrides severity", () => {
    const resolved = resolveConfig({
      rules: { naming: { severity: "warn" } },
    });
    expect(resolved.rules.naming.severity).toBe("warn");
  });

  it("overrides reporter maxIssuesPerCategory", () => {
    const resolved = resolveConfig({
      reporter: { maxIssuesPerCategory: 10 },
    });
    expect(resolved.reporter.maxIssuesPerCategory).toBe(10);
  });

  it("overrides custom keywords for semantic-drift", () => {
    const resolved = resolveConfig({
      rules: {
        "semantic-drift": {
          neutralKeywords: ["muted", "subtle"],
          brandKeywords: ["highlight"],
        },
      },
    });
    expect(resolved.rules["semantic-drift"].neutralKeywords).toEqual([
      "muted",
      "subtle",
    ]);
    expect(resolved.rules["semantic-drift"].brandKeywords).toEqual([
      "highlight",
    ]);
  });
});
