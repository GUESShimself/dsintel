import { AuditSummary } from "../rules/types.js";

export function formatJsonReport(summary: AuditSummary): string {
  const output = {
    version: "0.1.0",
    summary: {
      total: summary.total,
      pass: summary.pass,
      warn: summary.warn,
      fail: summary.fail,
      categories: summary.categories,
    },
    issues: summary.issues.map((issue) => ({
      path: issue.token.path,
      category: issue.token.category,
      severity: issue.severity,
      issueType: issue.issueType,
      message: issue.message,
      ...(issue.suggestedFix ? { suggestedFix: issue.suggestedFix } : {}),
      ...(issue.token.deprecated ? { deprecated: issue.token.deprecated } : {}),
    })),
  };

  return JSON.stringify(output, null, 2) + "\n";
}
