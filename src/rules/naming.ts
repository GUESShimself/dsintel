import { ParsedToken } from "../parser/types.js";
import { AuditIssue, AuditRule } from "./types.js";
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
      // camelCase → split on uppercase boundaries with spaces
      const decameled = s.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
      // hyphens and underscores → spaces (preserves single segment, spaces are spec-valid)
      return decameled.replace(/[-_]/g, " ");
    })
    .join(".");

  return fixed;
}

/** Create a naming rule. Convention check is opt-in via config.convention. */
export function createNamingRule(config: ResolvedNamingConfig): AuditRule {
  const pattern = config.convention
    ? (CONVENTIONS[config.convention] ?? new RegExp(config.convention))
    : null;

  return {
    name: "naming",

    run(tokens: ParsedToken[]): AuditIssue[] {
      const issues: AuditIssue[] = [];

      for (const token of tokens) {
        // Spec check — always on (DTCG forbids ".", "{", "}", "$"-prefix)
        const forbidden = token.rawSegments.filter(hasForbiddenChars);
        if (forbidden.length > 0) {
          issues.push({
            token,
            severity: "error",
            issueType: "naming: non-DTCG",
            message: `Token "${token.path}" contains forbidden characters in segment(s): ${forbidden.map((s) => `"${s}"`).join(", ")}. Names must not contain ".", "{", "}" or start with "$"`,
            suggestedFix: `Remove forbidden characters from token name`,
          });
          continue;
        }

        // Convention check — only if a convention is configured
        if (pattern) {
          const hasInvalid = token.rawSegments.some((s) => !pattern.test(s));
          if (hasInvalid) {
            const fix = suggestFix(token.rawSegments);
            issues.push({
              token,
              severity: config.severity,
              issueType: "naming: convention",
              message: `Token "${token.path}" does not follow the configured naming convention`,
              suggestedFix: `Rename → ${fix}`,
            });
          }
        }
      }

      return issues;
    },
  };
}

/** Default naming rule — spec violations only, no style convention. */
export const namingRule: AuditRule = createNamingRule({
  enabled: true,
  severity: "error",
});
