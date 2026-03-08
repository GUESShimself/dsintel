import { ParsedToken, ParseResult, TokenCategory } from "./types.js";

const DTCG_TYPE_TO_CATEGORY: Record<string, TokenCategory> = {
  // Primitive types
  color: "color",
  dimension: "spacing",
  fontFamily: "typography",
  fontWeight: "typography",
  fontStyle: "typography",
  fontSize: "typography",
  lineHeight: "typography",
  letterSpacing: "typography",
  duration: "other",
  cubicBezier: "other",
  number: "other",
  strokeStyle: "other",
  // Composite types
  border: "other",
  transition: "other",
  shadow: "other",
  gradient: "color",
  typography: "typography",
};

const NAME_PREFIX_TO_CATEGORY: Record<string, TokenCategory> = {
  color: "color",
  colours: "color",
  colors: "color",
  spacing: "spacing",
  space: "spacing",
  size: "spacing",
  font: "typography",
  text: "typography",
  typography: "typography",
  radius: "radius",
  radii: "radius",
  border: "other",
  shadow: "other",
  motion: "other",
  transition: "other",
  duration: "other",
  opacity: "other",
};

function inferCategory(type: string | undefined, path: string): TokenCategory {
  // $type takes priority
  if (type && type in DTCG_TYPE_TO_CATEGORY) {
    return DTCG_TYPE_TO_CATEGORY[type];
  }

  // Fall back to name-based inference from the first segment
  const firstSegment = path.split(".")[0].toLowerCase();
  if (firstSegment in NAME_PREFIX_TO_CATEGORY) {
    return NAME_PREFIX_TO_CATEGORY[firstSegment];
  }

  return "other";
}

const ALIAS_PATTERN = /^\{(.+)\}$/;

function parseAlias(value: unknown): string | undefined {
  if (typeof value === "string") {
    const match = value.match(ALIAS_PATTERN);
    return match ? match[1] : undefined;
  }
  return undefined;
}

/** Collect all alias references from a value, including within composite objects/arrays. */
function collectAliases(value: unknown): string[] {
  const aliases: string[] = [];

  if (typeof value === "string") {
    const match = value.match(ALIAS_PATTERN);
    if (match) aliases.push(match[1]);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      aliases.push(...collectAliases(item));
    }
  } else if (value !== null && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      aliases.push(...collectAliases(v));
    }
  }

  return aliases;
}

function isDTCGToken(node: Record<string, unknown>): boolean {
  return "$value" in node;
}

interface WalkContext {
  inheritedType: string | undefined;
  inheritedDeprecated: boolean | string | undefined;
}

function walk(
  node: Record<string, unknown>,
  segments: string[],
  ctx: WalkContext,
  tokens: ParsedToken[],
): void {
  // Check for inherited $type at group level
  const groupType =
    typeof node["$type"] === "string" ? node["$type"] : ctx.inheritedType;

  // Check for $deprecated at group level (inherits to children)
  const rawDeprecated = node["$deprecated"];
  const groupDeprecated =
    typeof rawDeprecated === "boolean" || typeof rawDeprecated === "string"
      ? rawDeprecated
      : ctx.inheritedDeprecated;

  if (isDTCGToken(node)) {
    const rawValue = node["$value"];
    const type = typeof node["$type"] === "string" ? node["$type"] : groupType;
    const path = segments.join(".");

    // Token-level $deprecated overrides group-level
    const tokenDeprecated =
      typeof node["$deprecated"] === "boolean" ||
      typeof node["$deprecated"] === "string"
        ? node["$deprecated"]
        : groupDeprecated;

    tokens.push({
      path,
      rawSegments: [...segments],
      value: rawValue,
      type,
      description:
        typeof node["$description"] === "string"
          ? node["$description"]
          : undefined,
      alias: parseAlias(rawValue),
      aliases: collectAliases(rawValue),
      deprecated: tokenDeprecated || undefined,
      category: inferCategory(type, path),
    });
    return;
  }

  // Recurse into child groups
  for (const [key, child] of Object.entries(node)) {
    // Skip DTCG meta keys
    if (key.startsWith("$")) continue;

    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      walk(
        child as Record<string, unknown>,
        [...segments, key],
        { inheritedType: groupType, inheritedDeprecated: groupDeprecated },
        tokens,
      );
    }
  }
}

export function parseDTCG(json: Record<string, unknown>): ParseResult {
  const tokens: ParsedToken[] = [];
  walk(json, [], { inheritedType: undefined, inheritedDeprecated: undefined }, tokens);
  return { tokens, format: "dtcg" };
}
