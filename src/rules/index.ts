import { ParsedToken, TokenCategory } from "../parser/types.js";
import { AuditRule, AuditSummary } from "./types.js";
import { namingRule, createNamingRule } from "./naming.js";
import { unusedRule, createUnusedRule } from "./unused.js";
import { semanticDriftRule, createSemanticDriftRule } from "./semantic-drift.js";
import { circularRefsRule } from "./circular-refs.js";
import { ResolvedConfig } from "../config/types.js";

export { AuditIssue, AuditSummary, AuditRule, Severity, IssueType } from "./types.js";

const defaultRules: AuditRule[] = [circularRefsRule, namingRule, unusedRule, semanticDriftRule];

/** Build a configured set of rules from a resolved config. */
export function buildRules(config: ResolvedConfig): AuditRule[] {
  // circular-refs is always enabled — the spec mandates detection (MUST)
  const rules: AuditRule[] = [circularRefsRule];

  if (config.rules.naming.enabled) {
    rules.push(createNamingRule(config.rules.naming));
  }
  if (config.rules.unused.enabled) {
    rules.push(createUnusedRule(config.rules.unused));
  }
  if (config.rules["semantic-drift"].enabled) {
    rules.push(createSemanticDriftRule(config.rules["semantic-drift"]));
  }

  return rules;
}

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
