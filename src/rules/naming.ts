import { ParsedToken } from "../parser/types.js";
import { AuditIssue, AuditRule } from "./types.js";

/**
 * Checks whether each segment of a token path follows DTCG dot-notation:
 * - Segments should be lowercase alphanumeric
 * - No camelCase, kebab-case, snake_case, or SCREAMING_CASE
 *
 * Valid:   color.brand.primary, spacing.lg, font.size.base
 * Invalid: colorBrandPrimary, color-brand-primary, color_brand_primary
 */

const VALID_SEGMENT = /^[a-z][a-z0-9]*$/;

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
