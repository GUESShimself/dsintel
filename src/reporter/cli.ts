import chalk from "chalk";
import { AuditIssue, AuditSummary } from "../rules/types.js";
import { TokenCategory } from "../parser/types.js";

const MAX_ISSUES_PER_CATEGORY = 5;

function severityBadge(severity: "error" | "warn"): string {
  return severity === "error"
    ? chalk.red(`[error]`)
    : chalk.yellow(`[warn] `);
}

function groupByCategory(
  issues: AuditIssue[],
): Map<TokenCategory, AuditIssue[]> {
  const grouped = new Map<TokenCategory, AuditIssue[]>();
  for (const issue of issues) {
    const cat = issue.token.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(issue);
  }
  return grouped;
}

export interface CliReportOptions {
  verbose?: boolean;
  reportHash?: string;
}

export function formatCliReport(
  summary: AuditSummary,
  options: CliReportOptions = {},
): string {
  const { verbose = false, reportHash = "preview" } = options;
  const lines: string[] = [];
  const startTime = performance.now();

  // Header
  lines.push("");
  lines.push(chalk.bold(`  DS Intelligence  v0.1.0`));
  lines.push(chalk.dim(`  Tokens:  ${summary.total} total · ${summary.categories.length} categories`));
  lines.push("");

  // Audit summary
  lines.push(chalk.dim("  AUDIT SUMMARY"));
  lines.push("");
  lines.push(
    `  ${chalk.bold.green(String(summary.pass))}    ${chalk.bold.yellow(String(summary.warn))}    ${chalk.bold.red(String(summary.fail))}`,
  );
  lines.push(
    `  ${chalk.dim("PASS")}   ${chalk.dim("WARN")}   ${chalk.dim("FAIL")}`,
  );
  lines.push("");

  // Flagged tokens
  if (summary.issues.length === 0) {
    lines.push(chalk.green("  ✓ No issues found. All tokens pass."));
    lines.push("");
  } else {
    lines.push(chalk.dim("  FLAGGED TOKENS"));
    lines.push("");

    const grouped = groupByCategory(summary.issues);

    for (const [category, issues] of grouped) {
      lines.push(
        chalk.dim(`  ── ${category.toUpperCase()}  (${issues.length} issues)`),
      );
      lines.push("");

      const display = verbose
        ? issues
        : issues.slice(0, MAX_ISSUES_PER_CATEGORY);

      for (const issue of display) {
        const badge = severityBadge(issue.severity);
        const name = chalk.bold(issue.token.path);
        const type = chalk.dim(issue.issueType);
        lines.push(`    ${badge}  ${name.padEnd(40)}${type}`);
        if (issue.suggestedFix) {
          lines.push(chalk.dim(`           fix: ${issue.suggestedFix}`));
        }
        lines.push("");
      }

      if (!verbose && issues.length > MAX_ISSUES_PER_CATEGORY) {
        const remaining = issues.length - MAX_ISSUES_PER_CATEGORY;
        lines.push(
          chalk.dim(
            `    ... ${remaining} more issues (run with --verbose to expand all)`,
          ),
        );
        lines.push("");
      }
    }
  }

  // Footer
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
  lines.push(chalk.dim("  ─────────────────────────────────────────"));
  lines.push(chalk.dim("  Full report available at:"));
  lines.push(
    `  ${chalk.underline(`https://app.dsintel.dev/report/${reportHash}`)}`,
  );
  lines.push(chalk.dim(`  Completed in ${elapsed}s`));
  lines.push("");

  return lines.join("\n");
}
