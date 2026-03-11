import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DsintelConfig, ResolvedConfig } from "./types.js";

export { DsintelConfig, ResolvedConfig } from "./types.js";
export {
  NamingRuleConfig,
  SemanticDriftRuleConfig,
  RuleConfigBase,
  ResolvedNamingConfig,
  ResolvedUnusedConfig,
  ResolvedSemanticDriftConfig,
  ResolvedReporterConfig,
} from "./types.js";

const CONFIG_FILENAME = "dsintel.config.json";

export const DEFAULT_CONFIG: ResolvedConfig = {
  rules: {
    naming: {
      enabled: true,
      severity: "error",
      convention: "lowercase",
    },
    unused: {
      enabled: true,
      severity: "warn",
    },
    "semantic-drift": {
      enabled: true,
      severity: "error",
      saturationThreshold: 20,
      neutralKeywords: [
        "surface",
        "background",
        "bg",
        "neutral",
        "gray",
        "grey",
        "white",
        "black",
        "border",
        "outline",
        "shadow",
      ],
      brandKeywords: [
        "brand",
        "primary",
        "secondary",
        "accent",
        "interactive",
        "action",
        "link",
      ],
    },
  },
  reporter: {
    maxIssuesPerCategory: 5,
  },
};

/**
 * Walk up from `startDir` looking for dsintel.config.json.
 * Returns the file path if found, null otherwise.
 */
export function findConfigFile(startDir?: string): string | null {
  let dir = resolve(startDir ?? process.cwd());

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = join(dir, CONFIG_FILENAME);
    if (existsSync(candidate)) return candidate;

    const parent = dirname(dir);
    if (parent === dir) return null; // reached filesystem root
    dir = parent;
  }
}

/**
 * Read and parse a config file. Throws on invalid JSON.
 */
export function loadConfig(filePath: string): DsintelConfig {
  const raw = readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw) as DsintelConfig;
  } catch {
    throw new Error(`Invalid JSON in config file: ${filePath}`);
  }
}

/**
 * Merge a partial user config with defaults to produce a fully resolved config.
 */
export function resolveConfig(
  fileConfig: DsintelConfig = {},
): ResolvedConfig {
  const d = DEFAULT_CONFIG;
  const r = fileConfig.rules ?? {};

  return {
    rules: {
      naming: {
        enabled: r.naming?.enabled ?? d.rules.naming.enabled,
        severity: r.naming?.severity ?? d.rules.naming.severity,
        convention: r.naming?.convention ?? d.rules.naming.convention,
      },
      unused: {
        enabled: r.unused?.enabled ?? d.rules.unused.enabled,
        severity: r.unused?.severity ?? d.rules.unused.severity,
      },
      "semantic-drift": {
        enabled:
          r["semantic-drift"]?.enabled ?? d.rules["semantic-drift"].enabled,
        severity:
          r["semantic-drift"]?.severity ?? d.rules["semantic-drift"].severity,
        saturationThreshold:
          r["semantic-drift"]?.saturationThreshold ??
          d.rules["semantic-drift"].saturationThreshold,
        neutralKeywords:
          r["semantic-drift"]?.neutralKeywords ??
          d.rules["semantic-drift"].neutralKeywords,
        brandKeywords:
          r["semantic-drift"]?.brandKeywords ??
          d.rules["semantic-drift"].brandKeywords,
      },
    },
    reporter: {
      maxIssuesPerCategory:
        fileConfig.reporter?.maxIssuesPerCategory ??
        d.reporter.maxIssuesPerCategory,
    },
  };
}

/**
 * Write the default config to dsintel.config.json in the given directory.
 * Returns the path of the written file.
 */
export function writeDefaultConfig(dir: string, force = false): string {
  const filePath = join(dir, CONFIG_FILENAME);
  if (existsSync(filePath) && !force) {
    throw new Error(
      `${CONFIG_FILENAME} already exists. Use --force to overwrite.`,
    );
  }

  // Write a clean default config with all values visible
  const content = JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n";
  writeFileSync(filePath, content, "utf-8");
  return filePath;
}
