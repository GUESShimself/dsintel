import { ParsedToken, TokenCategory } from "../parser/types.js";
import { AuditRule, AuditSummary } from "./types.js";
import { namingRule } from "./naming.js";
import { unusedRule } from "./unused.js";
import { semanticDriftRule } from "./semantic-drift.js";

export { AuditIssue, AuditSummary, AuditRule, Severity, IssueType } from "./types.js";

const defaultRules: AuditRule[] = [namingRule, unusedRule, semanticDriftRule];

export function runAudit(
  tokens: ParsedToken[],
  rules: AuditRule[] = defaultRules,
): AuditSummary {
  const allIssues = rules.flatMap((rule) => rule.run(tokens));

  // Deduplicate by token path + issue type
  const seen = new Set<string>();
  const issues = allIssues.filter((issue) => {
    const key = `${issue.token.path}::${issue.issueType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const failTokens = new Set(
    issues.filter((i) => i.severity === "error").map((i) => i.token.path),
  );
  const warnTokens = new Set(
    issues
      .filter((i) => i.severity === "warn")
      .map((i) => i.token.path)
      .filter((p) => !failTokens.has(p)),
  );

  const categories = [
    ...new Set(tokens.map((t) => t.category)),
  ] as TokenCategory[];

  return {
    total: tokens.length,
    pass: tokens.length - failTokens.size - warnTokens.size,
    warn: warnTokens.size,
    fail: failTokens.size,
    categories,
    issues,
  };
}
