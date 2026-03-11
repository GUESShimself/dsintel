import { ParsedToken } from "../parser/types.js";
import { AuditIssue, AuditRule, Severity } from "./types.js";
import { ResolvedNamingConfig } from "../config/types.js";

/**
 * Two checks:
 *
 * 1. Spec-forbidden characters — the DTCG spec forbids token/group names
 *    containing ".", "{", "}" or starting with "$". These make the file invalid.
 *
 * 2. Naming convention — checks whether each segment follows lowercase
 *    alphanumeric style (no camelCase, kebab-case, snake_case, SCREAMING_CASE).
 *    This is a best-practice lint, not a spec requirement.
 */

const CONVENTIONS: Record<string, RegExp> = {
  lowercase: /^[a-z0-9][a-z0-9 ]*$/,
  "kebab-case": /^[a-z][a-z0-9]*(-[a-z0-9]+| [a-z0-9]+)*$/,
};

const FORBIDDEN_CHARS = /[.{}]/;

function hasForbiddenChars(segment: string): boolean {
  return segment.startsWith("$") || FORBIDDEN_CHARS.test(segment);
}

function suggestFix(segments: string[]): string {
  const fixed = segments
    .map((s) => {
      // camelCase → split on uppercase boundaries
      const split = s.replace(/([a-z])([A-Z])/g, "$1.$2").toLowerCase();
      // kebab-case or snake_case → replace separators with dots
      // spaces → hyphens (keeps as single segment, valid for translation tool output)
      return split.replace(/[-_]/g, ".").replace(/ /g, "-");
    })
    .join(".");

  return fixed;
}

function buildNamingRule(
  pattern: RegExp,
  severity: Severity,
): AuditRule {
  return {
    name: "naming",

    run(tokens: ParsedToken[]): AuditIssue[] {
      const issues: AuditIssue[] = [];

      for (const token of tokens) {
        // Check for spec-forbidden characters first (always error)
        const forbidden = token.rawSegments.filter(hasForbiddenChars);
        if (forbidden.length > 0) {
          issues.push({
            token,
            severity: "error",
            issueType: "naming: non-DTCG",
            message: `Token "${token.path}" contains forbidden characters in segment(s): ${forbidden.map((s) => `"${s}"`).join(", ")}. Names must not contain ".", "{", "}" or start with "$"`,
            suggestedFix: `Remove forbidden characters from token name`,
          });
          continue; // Skip convention check if spec-invalid
        }

        // Convention check using configured pattern
        const hasInvalid = token.rawSegments.some((s) => !pattern.test(s));
        if (hasInvalid) {
          const fix = suggestFix(token.rawSegments);
          issues.push({
            token,
            severity,
            issueType: "naming: convention",
            message: `Token "${token.path}" does not follow the configured naming convention`,
            suggestedFix: `Rename → ${fix}`,
          });
        }
      }

      return issues;
    },
  };
}

/** Create a naming rule with custom config. */
export function createNamingRule(config: ResolvedNamingConfig): AuditRule {
  const pattern =
    CONVENTIONS[config.convention] ?? new RegExp(config.convention);
  return buildNamingRule(pattern, config.severity);
}

/** Default naming rule (backward compatible). */
export const namingRule: AuditRule = buildNamingRule(
  CONVENTIONS["lowercase"],
  "error",
);
