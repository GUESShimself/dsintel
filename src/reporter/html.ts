import { AuditIssue, AuditSummary } from "../rules/types.js";
import { TokenCategory } from "../parser/types.js";

export interface HtmlReportOptions {
  version?: string;
  repo?: string;
  branch?: string;
  commit?: string;
  timestamp?: string;
  reportHash?: string;
  verbose?: boolean;
  maxIssuesPerCategory?: number;
}

function groupByCategory(issues: AuditIssue[]): Map<TokenCategory, AuditIssue[]> {
  const grouped = new Map<TokenCategory, AuditIssue[]>();
  for (const issue of issues) {
    const cat = issue.token.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(issue);
  }
  return grouped;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function severityBadge(severity: "error" | "warn"): string {
  if (severity === "error") {
    return `<span class="badge badge-error">[error]</span>`;
  }
  return `<span class="badge badge-warn">[warn]</span>`;
}

function renderIssueRow(issue: AuditIssue): string {
  return `
    <div class="token-row">
      <div class="token-row-main">
        ${severityBadge(issue.severity)}
        <span class="token-name">${esc(issue.token.path)}</span>
        <span class="issue-type">${esc(issue.issueType)}</span>
      </div>
      ${issue.suggestedFix ? `<div class="token-fix">fix: ${esc(issue.suggestedFix)}</div>` : ""}
    </div>`;
}

function renderFlaggedTokens(
  summary: AuditSummary,
  verbose: boolean,
  maxIssuesPerCategory: number,
): string {
  if (summary.issues.length === 0) {
    return `<div class="no-issues">✓ No issues found. All tokens pass.</div>`;
  }

  const grouped = groupByCategory(summary.issues);
  const sections: string[] = [];

  for (const [category, issues] of grouped) {
    const display = verbose ? issues : issues.slice(0, maxIssuesPerCategory);
    const remaining = issues.length - display.length;

    sections.push(`
      <div class="category-group">
        <div class="category-header">── ${esc(category.toUpperCase())}&nbsp;&nbsp;(${issues.length} ${issues.length === 1 ? "issue" : "issues"})</div>
        ${display.map(renderIssueRow).join("")}
        ${remaining > 0 ? `<div class="more-issues">... ${remaining} more (run with --verbose to expand all)</div>` : ""}
      </div>`);
  }

  return sections.join("");
}

export function formatHtmlReport(
  summary: AuditSummary,
  options: HtmlReportOptions = {},
): string {
  const {
    version = "0.0.0",
    repo,
    branch,
    commit,
    timestamp,
    reportHash,
    verbose = false,
    maxIssuesPerCategory = 5,
  } = options;

  const branchStr = branch
    ? commit
      ? `${esc(branch)} <span class="dim">(commit ${esc(commit)})</span>`
      : esc(branch)
    : null;

  const flaggedHtml = renderFlaggedTokens(summary, verbose, maxIssuesPerCategory);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>dsintel audit report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: #000;
      color: #fff;
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      padding: 40px 20px;
    }

    .report {
      width: 100%;
      max-width: 860px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .anno {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      font-weight: 700;
      color: #808080;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .card {
      background: #111;
      border: 1px solid #1a1a1a;
      padding: 20px;
    }

    /* ── Header ── */
    .header-cmd {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #888888;
    }

    .header-title {
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      font-weight: 600;
      color: #fff;
      margin-top: 6px;
    }

    .header-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 6px;
    }

    .meta-row {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #999;
      display: flex;
      gap: 0;
    }

    .meta-label { color: #888888; min-width: 120px; display: inline-block; }

    /* ── Summary ── */
    .summary-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #808080;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .stats-row {
      display: flex;
      gap: 48px;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-number {
      font-family: 'JetBrains Mono', monospace;
      font-size: 28px;
      font-weight: 700;
      line-height: 1;
    }

    .stat-number.pass { color: #22c55e; }
    .stat-number.warn { color: #F59E0B; }
    .stat-number.fail { color: #FF4444; }

    .stat-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #888888;
      letter-spacing: 0.1em;
    }

    /* ── Flagged Tokens ── */
    .flagged-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      font-weight: 700;
      color: #808080;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .category-group { margin-bottom: 20px; }
    .category-group:last-child { margin-bottom: 0; }

    .category-header {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      color: #BFFF00;
      margin-bottom: 10px;
    }

    .token-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 6px 0;
      border-bottom: 1px solid #1a1a1a;
    }

    .token-row:last-of-type { border-bottom: none; }

    .token-row-main {
      display: flex;
      align-items: baseline;
      gap: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
    }

    .badge {
      font-size: 11px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      flex-shrink: 0;
    }

    .badge-error { color: #FF4444; }
    .badge-warn  { color: #F59E0B; }

    .token-name {
      font-weight: 600;
      color: #fff;
      flex-shrink: 0;
    }

    .issue-type {
      color: #888888;
      font-size: 11px;
    }

    .token-fix {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #808080;
      padding-left: 76px;
    }

    .more-issues {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #808080;
      margin-top: 8px;
    }

    .no-issues {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #22c55e;
    }

    /* ── Divider ── */
    .divider {
      height: 1px;
      background: #1a1a1a;
    }

    /* ── Footer ── */
    .footer-card {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .footer-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #888888;
    }

    .footer-hash {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #BFFF00;
    }

    .dim { color: #888888; }
  </style>
</head>
<body>
  <div class="report">
    <div class="anno">CLI AUDIT REPORT · terminal output after <code>dsintel audit</code></div>

    <!-- Header -->
    <div class="card">
      <div class="header-cmd">$ dsintel audit</div>
      <div class="header-title">DS Intelligence &nbsp; v${esc(version)}</div>
      <div class="header-meta">
        ${repo ? `<div class="meta-row"><span class="meta-label">Repo:      </span>${esc(repo)}</div>` : ""}
        ${branchStr ? `<div class="meta-row"><span class="meta-label">Branch:    </span>${branchStr}</div>` : ""}
        ${timestamp ? `<div class="meta-row"><span class="meta-label">Timestamp: </span>${esc(timestamp)}</div>` : ""}
        <div class="meta-row"><span class="meta-label">Tokens:    </span>${summary.total} total <span class="dim">&nbsp;·&nbsp;</span> ${summary.categories.length} categories</div>
      </div>
    </div>

    <!-- Summary -->
    <div class="card">
      <div class="summary-label">Audit Summary</div>
      <div class="stats-row">
        <div class="stat">
          <span class="stat-number pass">${summary.pass}</span>
          <span class="stat-label">PASS</span>
        </div>
        <div class="stat">
          <span class="stat-number warn">${summary.warn}</span>
          <span class="stat-label">WARN</span>
        </div>
        <div class="stat">
          <span class="stat-number fail">${summary.fail}</span>
          <span class="stat-label">FAIL</span>
        </div>
      </div>
    </div>

    <!-- Flagged Tokens -->
    <div class="card">
      <div class="flagged-label">Flagged Tokens</div>
      ${flaggedHtml}
    </div>

    <div class="divider"></div>

    <!-- Footer -->
    <div class="card footer-card">
      ${reportHash ? `<div class="footer-text">Report hash: <span class="footer-hash">${esc(reportHash)}</span></div>` : ""}
      <div class="footer-text">Web dashboard coming soon.</div>
    </div>
  </div>
</body>
</html>`;
}
