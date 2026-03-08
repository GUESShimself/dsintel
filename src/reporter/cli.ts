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

/** Pad a number to a fixed width for column alignment. */
function padNum(n: number, width: number): string {
  return String(n).padStart(width);
}

export interface CliReportOptions {
  verbose?: boolean;
  version?: string;
  /** SHA hash for the report URL (used when dashboard is available) */
  reportHash?: string;
  repo?: string;
  branch?: string;
  commit?: string;
  timestamp?: string;
}

export function formatCliReport(
  summary: AuditSummary,
  options: CliReportOptions = {},
): string {
  const {
    verbose = false,
    version = "0.0.0",
    reportHash,
    repo,
    branch,
    commit,
    timestamp,
  } = options;
  const lines: string[] = [];
  const startTime = performance.now();

  // ── Header ──────────────────────────────────────────
  lines.push("");
  lines.push(chalk.bold(`  DS Intelligence  v${version}`));
  if (repo) {
    lines.push(chalk.dim(`  Repo:       `) + repo);
  }
  if (branch) {
    const branchStr = commit
      ? `${branch} ${chalk.dim(`(commit ${commit})`)}`
      : branch;
    lines.push(chalk.dim(`  Branch:     `) + branchStr);
  }
  if (timestamp) {
    lines.push(chalk.dim(`  Timestamp:  `) + timestamp);
  }
  lines.push(
    chalk.dim(`  Tokens:     `) +
      `${summary.total} total ${chalk.dim("·")} ${summary.categories.length} categories`,
  );
  lines.push("");

  // ── Audit Summary ───────────────────────────────────
  lines.push(chalk.dim("  AUDIT SUMMARY"));
  lines.push("");

  const colW = Math.max(
    String(summary.pass).length,
    String(summary.warn).length,
    String(summary.fail).length,
    4,
  );

  lines.push(
    `  ${chalk.bold.green(padNum(summary.pass, colW))}    ${chalk.bold.yellow(padNum(summary.warn, colW))}    ${chalk.bold.red(padNum(summary.fail, colW))}`,
  );
  lines.push(
    `  ${"PASS".padStart(colW)}    ${"WARN".padStart(colW)}    ${"FAIL".padStart(colW)}`,
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
        chalk.dim(`  ──── `) +
          chalk.bold(category.toUpperCase()) +
          chalk.dim(`  (${issues.length} ${issues.length === 1 ? "issue" : "issues"})`),
      );
      lines.push("");

      const display = verbose
        ? issues
        : issues.slice(0, MAX_ISSUES_PER_CATEGORY);

      for (const issue of display) {
        const badge = severityBadge(issue.severity);
        const name = chalk.bold(issue.token.path);
        const type = chalk.dim(issue.issueType);
        lines.push(`    ${badge}    ${name.padEnd(36)}${type}`);
        if (issue.suggestedFix) {
          lines.push(chalk.dim(`              fix: ${issue.suggestedFix}`));
        }
        lines.push("");
      }

      if (!verbose && issues.length > MAX_ISSUES_PER_CATEGORY) {
        const remaining = issues.length - MAX_ISSUES_PER_CATEGORY;
        lines.push(
          chalk.dim(
            `    ... ${remaining} more (run with --verbose to expand all)`,
          ),
        );
        lines.push("");
      }
    }
  }

  // ── Footer ──────────────────────────────────────────
  const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
  lines.push("");
  if (reportHash) {
    // TODO: Uncomment when app.dsintel.dev is live
    // lines.push(chalk.dim("  Full report available at:"));
    // lines.push(`   ${chalk.underline(`https://app.dsintel.dev/report/${reportHash}`)}`);
    lines.push(chalk.dim(`  Report hash: ${reportHash}`));
  }
  lines.push(chalk.dim("  Web dashboard coming soon."));
  lines.push(chalk.dim(`  Completed in ${elapsed}s`));
  lines.push("");

  return lines.join("\n");
}
