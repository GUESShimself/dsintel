#!/usr/bin/env node

import { Command } from "commander";
import { parseTokenFile } from "./parser/index.js";
import { runAudit, buildRules } from "./rules/index.js";
import { formatCliReport, formatJsonReport, formatHtmlReport } from "./reporter/index.js";
import { findConfigFile, loadConfig, resolveConfig, writeDefaultConfig } from "./config/index.js";
import { convert, isFlatTokenFile, FlatTokenFile } from "./converter/index.js";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { createInterface } from "node:readline";
import { dirname, basename, extname, join } from "node:path";

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

function askYN(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, ans => { rl.close(); resolve(ans.trim().toLowerCase() === "y"); });
  });
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
  .option("--output <format>", "Output format: text, json, or html", "text")
  .option("--config <path>", "Path to a dsintel.config.json file")
  .option("--no-config", "Disable config file auto-discovery")
  .action(async (file: string, opts: { verbose: boolean; output: string; config?: string | boolean }) => {
    try {
      // Load configuration
      let fileConfig = {};
      if (opts.config !== false) {
        const configPath =
          typeof opts.config === "string"
            ? opts.config
            : findConfigFile();
        if (configPath) {
          fileConfig = loadConfig(configPath);
        }
      }
      const config = resolveConfig(fileConfig);
      const rules = buildRules(config);

      // Read file once — reused for flat detection, audit, and report hash
      let auditFile = file;
      let raw = await readFile(file, "utf-8");
      const json = JSON.parse(raw) as Record<string, unknown>;

      if (isFlatTokenFile(json)) {
        if (!process.stdin.isTTY) {
          throw new Error(`Flat token format detected in ${file}. Run: dsintel convert ${file}`);
        }
        const yes = await askYN("\n  Detected a flat token file. Convert to W3C DTCG format? [y/n] ");
        if (!yes) {
          throw new Error("Audit requires W3C DTCG format. Run: dsintel convert <file>");
        }
        const converted = convert(json as FlatTokenFile, {});
        const ext = extname(file);
        auditFile = join(dirname(file), `${basename(file, ext)}-dtcg${ext}`);
        raw = JSON.stringify(converted, null, 2) + "\n";
        await writeFile(auditFile, raw, "utf-8");
        console.error(`\n  Converted: ${auditFile}\n`);
      }

      const result = await parseTokenFile(auditFile);
      const summary = runAudit(result.tokens, rules);

      // Generate a short hash from the file contents for the report URL
      const reportHash = createHash("sha256").update(raw).digest("hex").slice(0, 10);

      let report: string;

      if (opts.output === "json") {
        report = formatJsonReport(summary);
      } else if (opts.output === "html") {
        const gitCtx = getGitContext();
        const now = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
        report = formatHtmlReport(summary, {
          verbose: opts.verbose,
          version,
          reportHash,
          repo: gitCtx.repo,
          branch: gitCtx.branch,
          commit: gitCtx.commit,
          timestamp: now,
          maxIssuesPerCategory: config.reporter.maxIssuesPerCategory,
        });
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
          maxIssuesPerCategory: config.reporter.maxIssuesPerCategory,
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

program
  .command("init")
  .description("Generate a starter dsintel.config.json in the current directory")
  .option("--force", "Overwrite existing config file", false)
  .action((opts: { force: boolean }) => {
    try {
      const filePath = writeDefaultConfig(process.cwd(), opts.force);
      console.log(`\n  Created ${filePath}\n`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\nError: ${message}\n`);
      process.exitCode = 1;
    }
  });

program
  .command("convert")
  .description("Convert a flat token file to W3C DTCG format")
  .argument("<file>", "Path to a flat JSON token file")
  .option("--out <file>", "Write output to a file instead of stdout")
  .option("--prefix <prefix>", "Token name prefix to strip (auto-detected if omitted)")
  .action(async (file: string, opts: { out?: string; prefix?: string }) => {
    try {
      const raw = await readFile(file, "utf-8");
      let json: Record<string, unknown>;

      try {
        json = JSON.parse(raw);
      } catch {
        throw new Error(`Failed to parse JSON from ${file}`);
      }

      const result = convert(json as FlatTokenFile, {
        prefix: opts.prefix,
      });

      const output = JSON.stringify(result, null, 2) + "\n";

      if (opts.out) {
        await writeFile(opts.out, output, "utf-8");
        console.log(`\n  Converted ${file} → ${opts.out}\n`);
      } else {
        process.stdout.write(output);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`\nError: ${message}\n`);
      process.exitCode = 1;
    }
  });

program.parse();
