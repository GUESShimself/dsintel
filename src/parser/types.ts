export type TokenCategory = "color" | "spacing" | "typography" | "radius" | "other";

export interface ParsedToken {
  /** Dot-notation path: e.g. "color.brand.primary" */
  path: string;
  /** Original key segments as found in the file */
  rawSegments: string[];
  /** Resolved value (string, number, or nested object) */
  value: unknown;
  /** DTCG $type if present */
  type?: string;
  /** DTCG $description if present */
  description?: string;
  /** Alias reference if value is a DTCG alias (e.g. "{color.base.blue}") */
  alias?: string;
  /** Inferred category */
  category: TokenCategory;
}

export interface ParseResult {
  tokens: ParsedToken[];
  format: "dtcg" | "tokens-studio" | "unknown";
}
