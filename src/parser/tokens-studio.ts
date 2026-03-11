import { ParsedToken, ParseResult, TokenCategory } from "./types.js";

const TS_TYPE_TO_CATEGORY: Record<string, TokenCategory> = {
  color: "color",
  dimension: "spacing",
  fontFamilies: "typography",
  fontWeights: "typography",
  fontSizes: "typography",
  lineHeights: "typography",
  letterSpacing: "typography",
  paragraphSpacing: "typography",
  sizing: "spacing",
  spacing: "spacing",
  borderRadius: "radius",
  borderWidth: "other",
  boxShadow: "other",
  typography: "typography",
  opacity: "other",
  other: "other",
};

const NAME_PREFIX_TO_CATEGORY: Record<string, TokenCategory> = {
  color: "color",
  colours: "color",
  colors: "color",
  spacing: "spacing",
  space: "spacing",
  size: "spacing",
  sizing: "spacing",
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

function inferCategory(
  type: string | undefined,
  path: string,
): TokenCategory {
  if (type && type in TS_TYPE_TO_CATEGORY) {
    return TS_TYPE_TO_CATEGORY[type];
  }

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

function isTokensStudioToken(node: Record<string, unknown>): boolean {
  return "value" in node && !isGroupNode(node);
}

/**
 * Tokens Studio groups can have `value` as a sub-object (not a leaf token).
 * A leaf token has `value` as a string, number, or array — not a plain object
 * without its own `value` key.
 */
function isGroupNode(node: Record<string, unknown>): boolean {
  const val = node["value"];
  // If value is a plain object that itself has child tokens (objects with `value`),
  // this node is actually a group, not a token.
  if (val !== null && typeof val === "object" && !Array.isArray(val)) {
    const inner = val as Record<string, unknown>;
    // Composite token values have known keys like fontFamily, color, etc.
    // Group nodes have child objects that themselves contain `value`.
    for (const child of Object.values(inner)) {
      if (
        child !== null &&
        typeof child === "object" &&
        !Array.isArray(child) &&
        "value" in (child as Record<string, unknown>)
      ) {
        return true;
      }
    }
  }
  return false;
}

interface WalkContext {
  inheritedType: string | undefined;
}

function walk(
  node: Record<string, unknown>,
  segments: string[],
  ctx: WalkContext,
  tokens: ParsedToken[],
): void {
  // Check for inherited type at group level
  const groupType =
    typeof node["type"] === "string" && !("value" in node)
      ? node["type"]
      : ctx.inheritedType;

  if (isTokensStudioToken(node)) {
    const rawValue = node["value"];
    const type = typeof node["type"] === "string" ? node["type"] : groupType;
    const path = segments.join(".");

    tokens.push({
      path,
      rawSegments: [...segments],
      value: rawValue,
      type,
      description:
        typeof node["description"] === "string"
          ? node["description"]
          : undefined,
      alias: parseAlias(rawValue),
      aliases: collectAliases(rawValue),
      category: inferCategory(type, path),
    });
    return;
  }

  // Recurse into child groups
  for (const [key, child] of Object.entries(node)) {
    // Skip Tokens Studio meta keys
    if (
      key === "type" ||
      key === "description" ||
      key === "$themes" ||
      key === "$metadata"
    ) {
      continue;
    }

    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      walk(
        child as Record<string, unknown>,
        [...segments, key],
        { inheritedType: groupType },
        tokens,
      );
    }
  }
}

export function parseTokensStudio(
  json: Record<string, unknown>,
): ParseResult {
  const tokens: ParsedToken[] = [];
  walk(
    json,
    [],
    { inheritedType: undefined },
    tokens,
  );
  return { tokens, format: "tokens-studio" };
}
