import { ParsedToken } from "../parser/types.js";
import { AuditIssue, AuditRule, Severity } from "./types.js";
import { ResolvedUnusedConfig } from "../config/types.js";

function buildUnusedRule(severity: Severity): AuditRule {
  return {
    name: "unused",

    run(tokens: ParsedToken[]): AuditIssue[] {
      // Build a set of all paths that are referenced as aliases
      // (includes references within composite token sub-properties)
      const referencedPaths = new Set<string>();
      for (const token of tokens) {
        for (const alias of token.aliases) {
          referencedPaths.add(alias);
        }
      }

      const issues: AuditIssue[] = [];

      for (const token of tokens) {
        // A token is "unused" if nothing aliases it AND it has no outgoing aliases.
        // Leaf tokens (non-aliases) that are never referenced are flagged.
        if (token.aliases.length === 0 && !referencedPaths.has(token.path)) {
          issues.push({
            token,
            severity,
            issueType: "unused",
            message: `Token "${token.path}" has no references found`,
            suggestedFix: "No references found — consider removing",
          });
        }
      }

      return issues;
    },
  };
}

/** Create an unused rule with custom config. */
export function createUnusedRule(config: ResolvedUnusedConfig): AuditRule {
  return buildUnusedRule(config.severity);
}

/** Default unused rule (backward compatible). */
export const unusedRule: AuditRule = buildUnusedRule("warn");
