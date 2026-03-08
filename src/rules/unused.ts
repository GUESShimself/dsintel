import { ParsedToken } from "../parser/types.js";
import { AuditIssue, AuditRule } from "./types.js";

export const unusedRule: AuditRule = {
  name: "unused",

  run(tokens: ParsedToken[]): AuditIssue[] {
    // Build a set of all paths that are referenced as aliases
    const referencedPaths = new Set<string>();
    for (const token of tokens) {
      if (token.alias) {
        referencedPaths.add(token.alias);
      }
    }

    const issues: AuditIssue[] = [];

    for (const token of tokens) {
      // A token is "unused" if nothing aliases it AND it is not itself an alias.
      // Leaf tokens (non-aliases) that are never referenced are flagged.
      if (!token.alias && !referencedPaths.has(token.path)) {
        issues.push({
          token,
          severity: "warn",
          issueType: "unused",
          message: `Token "${token.path}" has no references found`,
          suggestedFix: "No references found — consider removing",
        });
      }
    }

    return issues;
  },
};
