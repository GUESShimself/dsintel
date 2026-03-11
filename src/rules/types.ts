import { ParsedToken, TokenCategory } from "../parser/types.js";

export type Severity = "error" | "warn";

export type IssueType = "naming: non-DTCG" | "naming: convention" | "unused" | "semantic drift" | "circular reference";

export interface AuditIssue {
  token: ParsedToken;
  severity: Severity;
  issueType: IssueType;
  message: string;
  suggestedFix?: string;
}

export interface AuditSummary {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  categories: TokenCategory[];
  issues: AuditIssue[];
}

export interface AuditRule {
  name: string;
  run(tokens: ParsedToken[]): AuditIssue[];
}
