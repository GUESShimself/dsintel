import { ParsedToken } from "../parser/types.js";
import { AuditIssue, AuditRule } from "./types.js";

/**
 * Detects circular alias references per the DTCG spec (2025.10):
 * "References MUST NOT be circular. If a design token file contains circular
 * references, then the value of all tokens in that chain is unknown and an
 * appropriate error or warning message SHOULD be displayed to the user."
 *
 * All tokens in a circular chain are reported as errors.
 */
function findCyclicTokenPaths(tokens: ParsedToken[]): Set<string> {
  const aliasMap = new Map<string, string[]>();
  for (const token of tokens) {
    if (token.aliases.length > 0) {
      aliasMap.set(token.path, token.aliases);
    }
  }

  const inCycle = new Set<string>();
  const fullyExplored = new Set<string>();

  function dfs(node: string, visiting: Set<string>, path: string[]): void {
    if (fullyExplored.has(node)) return;
    if (visiting.has(node)) {
      // Cycle detected — mark every token in the current path from where node first appears
      const cycleStart = path.indexOf(node);
      for (const p of path.slice(cycleStart)) {
        inCycle.add(p);
      }
      return;
    }

    visiting.add(node);
    path.push(node);

    for (const target of (aliasMap.get(node) ?? [])) {
      dfs(target, visiting, path);
    }

    path.pop();
    visiting.delete(node);
    fullyExplored.add(node);
  }

  for (const token of tokens) {
    if (token.aliases.length > 0 && !fullyExplored.has(token.path)) {
      dfs(token.path, new Set(), []);
    }
  }

  return inCycle;
}

export const circularRefsRule: AuditRule = {
  name: "circular-refs",

  run(tokens: ParsedToken[]): AuditIssue[] {
    const cyclicPaths = findCyclicTokenPaths(tokens);
    if (cyclicPaths.size === 0) return [];

    const tokenMap = new Map(tokens.map((t) => [t.path, t]));
    const issues: AuditIssue[] = [];

    for (const path of cyclicPaths) {
      const token = tokenMap.get(path);
      if (token) {
        issues.push({
          token,
          severity: "error",
          issueType: "circular reference",
          message: `Token "${path}" is part of a circular reference chain`,
          suggestedFix: "Replace one alias in the chain with a concrete value",
        });
      }
    }

    return issues;
  },
};
