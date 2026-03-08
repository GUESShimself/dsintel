#!/usr/bin/env node

import { Command } from "commander";
import { parseTokenFile } from "./parser/index.js";
import { runAudit } from "./rules/index.js";
import { formatCliReport } from "./reporter/index.js";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const program = new Command();

program
  .name("dsintel")
  .description("Design system token auditing tool")
  .version("0.1.0");

program
  .command("audit")
  .description("Audit a design token file for issues")
  .argument("<file>", "Path to a JSON token file (W3C DTCG format)")
  .option("--verbose", "Show all flagged tokens (no truncation)", false)
  .action(async (file: string, opts: { verbose: boolean }) => {
    try {
      const result = await parseTokenFile(file);
      const summary = runAudit(result.tokens);

      // Generate a short hash from the file contents for the report URL
      const raw = await readFile(file, "utf-8");
      const hash = createHash("sha256").update(raw).digest("hex").slice(0, 10);

      const report = formatCliReport(summary, {
        verbose: opts.verbose,
        reportHash: hash,
      });

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
