import { readFile } from "node:fs/promises";
import { ParseResult } from "./types.js";
import { parseDTCG } from "./dtcg.js";
import { parseTokensStudio } from "./tokens-studio.js";

export { ParsedToken, ParseResult, TokenCategory } from "./types.js";

function detectFormat(
  json: Record<string, unknown>,
): "dtcg" | "tokens-studio" | "unknown" {
  // DTCG files use $value at the leaf level
  // Walk one level deep to check for $value keys
  for (const value of Object.values(json)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if ("$value" in obj) return "dtcg";
      if ("value" in obj && !("$value" in obj)) return "tokens-studio";

      // Check one more level deep
      for (const nested of Object.values(obj)) {
        if (
          nested !== null &&
          typeof nested === "object" &&
          !Array.isArray(nested)
        ) {
          const nestedObj = nested as Record<string, unknown>;
          if ("$value" in nestedObj) return "dtcg";
          if ("value" in nestedObj && !("$value" in nestedObj))
            return "tokens-studio";
        }
      }
    }
  }
  return "unknown";
}

export async function parseTokenFile(filePath: string): Promise<ParseResult> {
  const raw = await readFile(filePath, "utf-8");
  let json: Record<string, unknown>;

  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse JSON from ${filePath}`);
  }

  const format = detectFormat(json);

  switch (format) {
    case "dtcg":
      return parseDTCG(json);
    case "tokens-studio":
      return parseTokensStudio(json);
    default:
      throw new Error(
        `Could not detect token format in ${filePath}. Expected W3C DTCG or Tokens Studio format.`,
      );
  }
}
