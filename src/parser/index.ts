import { readFile } from "node:fs/promises";
import { ParseResult } from "./types.js";
import { parseDTCG } from "./dtcg.js";
import { parseTokensStudio } from "./tokens-studio.js";

export { ParsedToken, ParseResult, TokenCategory } from "./types.js";

function detectFormat(
  json: Record<string, unknown>,
): "dtcg" | "tokens-studio" | "unknown" {
  function walk(obj: Record<string, unknown>): "dtcg" | "tokens-studio" | "unknown" {
    if ("$value" in obj) return "dtcg";
    if ("value" in obj) return "tokens-studio";
    for (const val of Object.values(obj)) {
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        const result = walk(val as Record<string, unknown>);
        if (result !== "unknown") return result;
      }
    }
    return "unknown";
  }
  return walk(json);
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
