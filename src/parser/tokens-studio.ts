import { ParseResult } from "./types.js";

export function parseTokensStudio(
  _json: Record<string, unknown>,
): ParseResult {
  // TODO: Implement Tokens Studio format parsing
  // Tokens Studio nests tokens under group objects without $value,
  // using "value" instead and a different structure for aliases.
  throw new Error(
    "Tokens Studio format is not yet supported. Please convert to W3C DTCG format.",
  );
}
