#!/usr/bin/env node

import { Command } from "commander";
import { parseTokenFile } from "./parser/index.js";
import { runAudit } from "./rules/index.js";
import { formatCliReport, formatJsonReport } from "./reporter/index.js";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

function git(cmd: string): string | undefined {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim() || undefined;
  } catch {
    return undefined;
  }
}

function getGitContext(): {
  repo?: string;
  branch?: string;
  commit?: string;
} {
  const remote = git("git remote get-url origin");
  const repo = remote
    ?.replace(/\.git$/, "")
    .replace(/^.*(?:github|gitlab)\.com[:/]/, "");
  const branch = git("git branch --show-current");
  const commit = git("git rev-parse --short HEAD");
  return { repo, branch, commit };
}

const program = new Command();

program
  .name("dsintel")
  .description("Design system token auditing tool")
  .version(version);

program
  .command("audit")
  .description("Audit a design token file for issues")
  .argument("<file>", "Path to a JSON token file (W3C DTCG format)")
  .option("--verbose", "Show all flagged tokens (no truncation)", false)
  .option("--output <format>", "Output format: text or json", "text")
  .action(async (file: string, opts: { verbose: boolean; output: string }) => {
    try {
      const result = await parseTokenFile(file);
      const summary = runAudit(result.tokens);

      // Generate a short hash from the file contents for the report URL
      const raw = await readFile(file, "utf-8");
      const reportHash = createHash("sha256").update(raw).digest("hex").slice(0, 10);

      let report: string;

      if (opts.output === "json") {
        report = formatJsonReport(summary);
      } else {
        const gitCtx = getGitContext();
        const now = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
        report = formatCliReport(summary, {
          verbose: opts.verbose,
          version,
          reportHash,
          repo: gitCtx.repo,
          branch: gitCtx.branch,
          commit: gitCtx.commit,
          timestamp: now,
        });
      }

      process.stdout.write(report);

      // Exit with code 1 if there are errors
      if (summary.fail > 0) {
        process.exitCode = 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\nError: ${message}\n`);
      process.exitCode = 1;
    }
  });

program.parse();
