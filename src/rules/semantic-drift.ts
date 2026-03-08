import { ParsedToken } from "../parser/types.js";
import { AuditIssue, AuditRule } from "./types.js";

/**
 * Detects tokens whose resolved value diverges from what their name implies.
 *
 * Examples:
 * - A token named "color.surface.default" should resolve to a neutral color,
 *   not a saturated hue.
 * - A token named "color.brand.primary" aliasing to a gray palette token.
 *
 * Strategy: resolve the alias chain and check if the final value makes sense
 * for the semantic name. For now, we focus on color tokens with alias chains
 * that cross semantic boundaries.
 */

const NEUTRAL_NAMES = new Set([
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
]);

const BRAND_NAMES = new Set([
  "brand",
  "primary",
  "secondary",
  "accent",
  "interactive",
  "action",
  "link",
]);

function getSemanticGroup(path: string): "neutral" | "brand" | "unknown" {
  const segments = path.toLowerCase().split(".");
  for (const seg of segments) {
    if (NEUTRAL_NAMES.has(seg)) return "neutral";
    if (BRAND_NAMES.has(seg)) return "brand";
  }
  return "unknown";
}

/** Parse a hex color and return HSL saturation (0-100). */
function hexSaturation(hex: string): number | null {
  const match = hex.match(/^#?([0-9a-f]{6}|[0-9a-f]{3})$/i);
  if (!match) return null;

  let r: number, g: number, b: number;
  const h = match[1];
  if (h.length === 3) {
    r = parseInt(h[0] + h[0], 16) / 255;
    g = parseInt(h[1] + h[1], 16) / 255;
    b = parseInt(h[2] + h[2], 16) / 255;
  } else {
    r = parseInt(h.slice(0, 2), 16) / 255;
    g = parseInt(h.slice(2, 4), 16) / 255;
    b = parseInt(h.slice(4, 6), 16) / 255;
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return 0;

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  return Math.round(s * 100);
}

function resolveValue(
  token: ParsedToken,
  tokenMap: Map<string, ParsedToken>,
  visited: Set<string> = new Set(),
): unknown {
  if (visited.has(token.path)) return token.value; // circular ref guard
  visited.add(token.path);

  if (token.alias) {
    const target = tokenMap.get(token.alias);
    if (target) return resolveValue(target, tokenMap, visited);
  }
  return token.value;
}

export const semanticDriftRule: AuditRule = {
  name: "semantic-drift",

  run(tokens: ParsedToken[]): AuditIssue[] {
    const tokenMap = new Map<string, ParsedToken>();
    for (const t of tokens) tokenMap.set(t.path, t);

    const issues: AuditIssue[] = [];

    for (const token of tokens) {
      if (token.category !== "color") continue;

      const semanticGroup = getSemanticGroup(token.path);
      if (semanticGroup === "unknown") continue;

      const resolved = resolveValue(token, tokenMap);
      if (typeof resolved !== "string") continue;

      const saturation = hexSaturation(resolved);
      if (saturation === null) continue;

      // Neutral tokens with high saturation → drift
      if (semanticGroup === "neutral" && saturation > 20) {
        issues.push({
          token,
          severity: "error",
          issueType: "semantic drift",
          message: `Token "${token.path}" implies neutral but resolves to a saturated color (saturation: ${saturation}%)`,
          suggestedFix:
            "Value diverges from alias chain — check reference chain",
        });
      }
    }

    return issues;
  },
};
