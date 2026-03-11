import { FlatTokenFile, ConvertOptions } from "./types.js";

export { FlatTokenFile, ConvertOptions } from "./types.js";

// ── Category → DTCG $type mapping ──────────────────────────────────

const CATEGORY_TYPE_MAP: Record<string, string> = {
  "border-radius": "dimension",
  "border-width": "dimension",
  spacing: "dimension",
  "letter-spacing": "dimension",
  "word-spacing": "dimension",
  breakpoints: "number",
  "z-index": "number",
  opacity: "number",
};

function inferCategoryType(category: string): string | undefined {
  if (CATEGORY_TYPE_MAP[category]) return CATEGORY_TYPE_MAP[category];
  if (category.startsWith("colors")) return "color";
  return undefined;
}

// ── Typography sub-type inference ──────────────────────────────────

function inferTypographyTokenType(
  key: string,
): string | undefined {
  if (key.includes("font-family") || key.includes("fontFamilies"))
    return "fontFamily";
  if (key.includes("font-weight") || key.includes("fontWeights"))
    return "fontWeight";
  if (
    key.includes("font-size") ||
    key.includes("line-height") ||
    key.includes("letter-spacing") ||
    key.includes("paragraph-spacing")
  )
    return "dimension";
  return undefined;
}

// ── Value normalization ────────────────────────────────────────────

function normalizeValue(value: string, type?: string): unknown {
  // Percentages for number-typed tokens → 0-1 range
  if (type === "number" && value.endsWith("%")) {
    const n = parseFloat(value);
    return isNaN(n) ? value : n / 100;
  }
  // Unitless numeric strings for number-typed tokens → actual number
  if (type === "number" && /^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }
  return value;
}

// ── Prefix detection ───────────────────────────────────────────────

export function detectPrefix(file: FlatTokenFile): string[] {
  const prefixes = new Set<string>();
  const nonTripleKeys: string[] = [];

  for (const entries of Object.values(file)) {
    for (const key of Object.keys(entries)) {
      // Triple-hyphen pattern: "nj-atheneumStyles---"
      const tripleIdx = key.indexOf("---");
      if (tripleIdx !== -1) {
        prefixes.add(key.slice(0, tripleIdx + 3));
      } else {
        nonTripleKeys.push(key);
      }
    }
  }

  // Also detect shorter prefix for keys without "---"
  // These often share a short prefix like "nj-" before the category name
  if (nonTripleKeys.length > 0) {
    let common = nonTripleKeys[0];
    for (const key of nonTripleKeys) {
      while (!key.startsWith(common)) {
        common = common.slice(0, -1);
      }
      if (common.length === 0) break;
    }
    // Trim to last hyphen boundary
    const lastHyphen = common.lastIndexOf("-");
    if (lastHyphen > 0) {
      prefixes.add(common.slice(0, lastHyphen + 1));
    }
  }

  return [...prefixes];
}

/**
 * Strip the detected prefix and category-redundant portion from a key.
 */
function stripKey(
  key: string,
  prefixes: string[],
  category: string,
): string {
  let stripped = key;

  // Strip longest matching prefix first
  const sorted = [...prefixes].sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (stripped.startsWith(prefix)) {
      stripped = stripped.slice(prefix.length);
      break;
    }
  }

  // Strip category-redundant prefix (e.g., "border-radius-" in border-radius category)
  if (stripped.startsWith(category + "-")) {
    stripped = stripped.slice(category.length + 1);
  }

  return stripped;
}

// ── Composite reassembly ───────────────────────────────────────────

const SHADOW_SUFFIXES = ["-x", "-y", "-blur", "-spread", "-color", "-type"];
const TYPO_SUFFIXES = [
  "-font-family",
  "-font-weight",
  "-line-height",
  "-font-size",
  "-letter-spacing",
  "-paragraph-spacing",
  "-text-case",
  "-text-decoration",
];

interface CompositeResult {
  composites: Record<string, Record<string, unknown>>;
  remaining: [string, string][];
}

function reassembleShadows(
  entries: [string, string][],
): CompositeResult {
  const map = new Map(entries);
  const composites: Record<string, Record<string, unknown>> = {};
  const consumed = new Set<string>();

  for (const [key, value] of entries) {
    if (!value.endsWith("-group")) continue;

    // This is a composite marker
    const base = key;
    const parts: Record<string, string> = {};
    for (const suffix of SHADOW_SUFFIXES) {
      const partKey = base + suffix;
      if (map.has(partKey)) {
        parts[suffix.slice(1)] = map.get(partKey)!;
        consumed.add(partKey);
      }
    }
    consumed.add(key);

    if (parts.x !== undefined) {
      composites[base] = {
        $value: {
          offsetX: parts.x,
          offsetY: parts.y,
          blur: parts.blur,
          spread: parts.spread,
          color: parts.color,
        },
      };
    }
  }

  const remaining = entries.filter(([k]) => !consumed.has(k));
  return { composites, remaining };
}

function reassembleTypography(
  entries: [string, string][],
): CompositeResult {
  const map = new Map(entries);
  const composites: Record<string, Record<string, unknown>> = {};
  const consumed = new Set<string>();

  for (const [key, value] of entries) {
    if (!value.endsWith("-group")) continue;

    const base = key;
    const parts: Record<string, string> = {};
    for (const suffix of TYPO_SUFFIXES) {
      const partKey = base + suffix;
      if (map.has(partKey)) {
        parts[suffix.slice(1)] = map.get(partKey)!;
        consumed.add(partKey);
      }
    }
    consumed.add(key);

    if (parts["font-family"] !== undefined) {
      composites[base] = {
        $value: {
          fontFamily: parts["font-family"],
          fontWeight: parts["font-weight"],
          lineHeight: parts["line-height"],
          fontSize: parts["font-size"],
          letterSpacing: parts["letter-spacing"],
        },
      };
    }
  }

  const remaining = entries.filter(([k]) => !consumed.has(k));
  return { composites, remaining };
}

/**
 * For gradient categories, keep the full gradient string and consume
 * decomposed parts (-group, -angle, -colorStop-*).
 */
function reassembleGradients(
  entries: [string, string][],
): CompositeResult {
  const composites: Record<string, Record<string, unknown>> = {};
  const consumed = new Set<string>();

  // Find group markers and their bases
  const groupBases = new Set<string>();
  for (const [key, value] of entries) {
    if (key.endsWith("-group") && value.endsWith("-group")) {
      groupBases.add(key.replace(/-group$/, ""));
      consumed.add(key);
    }
  }

  // Consume decomposed gradient parts
  for (const base of groupBases) {
    for (const [key] of entries) {
      if (
        key !== base &&
        key.startsWith(base + "-") &&
        !consumed.has(key)
      ) {
        consumed.add(key);
      }
    }
  }

  const remaining = entries.filter(([k]) => !consumed.has(k));
  return { composites, remaining };
}

// ── Nesting ────────────────────────────────────────────────────────

function setNested(
  obj: Record<string, unknown>,
  segments: string[],
  value: unknown,
): void {
  let current = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    if (!(seg in current) || typeof current[seg] !== "object") {
      current[seg] = {};
    }
    current = current[seg] as Record<string, unknown>;
  }
  current[segments[segments.length - 1]] = value;
}

// ── Main convert function ──────────────────────────────────────────

export function convert(
  json: FlatTokenFile,
  options: ConvertOptions = {},
): Record<string, unknown> {
  const prefixes =
    options.prefix !== undefined ? [options.prefix] : detectPrefix(json);
  const output: Record<string, unknown> = {};

  for (const [category, entries] of Object.entries(json)) {
    const categoryType = inferCategoryType(category);
    const categoryGroup: Record<string, unknown> = {};

    if (categoryType) {
      categoryGroup.$type = categoryType;
    }

    // Strip prefixes from all keys
    let stripped: [string, string][] = Object.entries(entries).map(
      ([key, value]) => [stripKey(key, prefixes, category), value],
    );

    // Reassemble composites based on category
    let composites: Record<string, Record<string, unknown>> = {};

    if (category === "box-shadow") {
      const result = reassembleShadows(stripped);
      composites = result.composites;
      stripped = result.remaining;
      if (!categoryGroup.$type) categoryGroup.$type = "shadow";
    } else if (category === "typography-composites") {
      const result = reassembleTypography(stripped);
      composites = result.composites;
      stripped = result.remaining;
      categoryGroup.$type = "typography";
    } else if (
      category === "gradients" ||
      category.startsWith("colors")
    ) {
      // Clean up gradient decomposed parts
      const result = reassembleGradients(stripped);
      composites = result.composites;
      stripped = result.remaining;
    }

    // Add composites to the group
    for (const [name, token] of Object.entries(composites)) {
      const segments = name.split("-");
      setNested(categoryGroup, segments, token);
    }

    // Process remaining flat tokens
    for (const [key, value] of stripped) {
      // Infer per-token type for mixed categories like "typography"
      let tokenType: string | undefined;
      if (category === "typography") {
        tokenType = inferTypographyTokenType(key);
      }

      const normalized = normalizeValue(value, categoryType ?? tokenType);
      const token: Record<string, unknown> = { $value: normalized };
      if (tokenType && !categoryType) {
        token.$type = tokenType;
      }

      const segments = key.split("-");
      setNested(categoryGroup, segments, token);
    }

    output[category] = categoryGroup;
  }

  return output;
}

/**
 * Detect whether a JSON object looks like a flat token file.
 * Returns true if top-level values are objects with only string values (no $value keys).
 */
export function isFlatTokenFile(json: Record<string, unknown>): boolean {
  const values = Object.values(json);
  if (values.length === 0) return false;

  let checked = 0;
  for (const value of values) {
    if (value === null || typeof value !== "object" || Array.isArray(value))
      return false;

    const inner = value as Record<string, unknown>;
    const innerValues = Object.values(inner);
    if (innerValues.length === 0) continue;

    // Check a sample — all values should be strings (not objects with $value)
    for (const iv of innerValues.slice(0, 5)) {
      if (typeof iv !== "string") return false;
    }
    checked++;
    if (checked >= 3) break;
  }

  return checked > 0;
}
