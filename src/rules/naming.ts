import { ParsedToken } from "../parser/types.js";
import { AuditIssue, AuditRule } from "./types.js";

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

const VALID_SEGMENT = /^[a-z0-9]+$/;
const FORBIDDEN_CHARS = /[.{}]/;

function hasForbiddenChars(segment: string): boolean {
  return segment.startsWith("$") || FORBIDDEN_CHARS.test(segment);
}

function hasInvalidSegments(segments: string[]): boolean {
  return segments.some((s) => !VALID_SEGMENT.test(s));
}

function suggestFix(segments: string[]): string {
  const fixed = segments
    .map((s) => {
      // camelCase → split on uppercase boundaries
      const split = s.replace(/([a-z])([A-Z])/g, "$1.$2").toLowerCase();
      // kebab-case or snake_case → replace separators with dots
      return split.replace(/[-_]/g, ".");
    })
    .join(".");

  return fixed;
}

export const namingRule: AuditRule = {
  name: "naming",

  run(tokens: ParsedToken[]): AuditIssue[] {
    const issues: AuditIssue[] = [];

    for (const token of tokens) {
      // Check for spec-forbidden characters first (higher severity)
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

      // Convention check: lowercase alphanumeric segments
      if (hasInvalidSegments(token.rawSegments)) {
        const fix = suggestFix(token.rawSegments);
        issues.push({
          token,
          severity: "error",
          issueType: "naming: non-DTCG",
          message: `Token "${token.path}" does not follow DTCG dot-notation naming`,
          suggestedFix: `Rename → ${fix}`,
        });
      }
    }

    return issues;
  },
};
