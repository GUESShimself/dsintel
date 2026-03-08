import { ParsedToken, ParseResult, TokenCategory } from "./types.js";

const DTCG_TYPE_TO_CATEGORY: Record<string, TokenCategory> = {
  color: "color",
  dimension: "spacing",
  spacing: "spacing",
  fontFamily: "typography",
  fontWeight: "typography",
  fontSize: "typography",
  lineHeight: "typography",
  letterSpacing: "typography",
  typography: "typography",
  borderRadius: "radius",
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
  borderRadius: "radius",
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

function isDTCGToken(node: Record<string, unknown>): boolean {
  return "$value" in node;
}

function walk(
  node: Record<string, unknown>,
  segments: string[],
  inheritedType: string | undefined,
  tokens: ParsedToken[],
): void {
  // Check for inherited $type at group level
  const groupType =
    typeof node["$type"] === "string" ? node["$type"] : inheritedType;

  if (isDTCGToken(node)) {
    const rawValue = node["$value"];
    const type = typeof node["$type"] === "string" ? node["$type"] : groupType;
    const path = segments.join(".");

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
      category: inferCategory(type, path),
    });
    return;
  }

  // Recurse into child groups
  for (const [key, child] of Object.entries(node)) {
    // Skip DTCG meta keys
    if (key.startsWith("$")) continue;

    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      walk(child as Record<string, unknown>, [...segments, key], groupType, tokens);
    }
  }
}

export function parseDTCG(json: Record<string, unknown>): ParseResult {
  const tokens: ParsedToken[] = [];
  walk(json, [], undefined, tokens);
  return { tokens, format: "dtcg" };
}
