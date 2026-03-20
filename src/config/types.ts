import { Severity } from "../rules/types.js";

// ── User-facing config (all optional — from dsintel.config.json) ────

export interface RuleConfigBase {
  enabled?: boolean;
  severity?: Severity;
}

export interface NamingRuleConfig extends RuleConfigBase {
  /** "lowercase" | "kebab-case" | a custom regex string */
  convention?: string;
}

export interface SemanticDriftRuleConfig extends RuleConfigBase {
  saturationThreshold?: number;
  neutralKeywords?: string[];
  brandKeywords?: string[];
}

export interface ReporterConfig {
  maxIssuesPerCategory?: number;
}

export interface DsintelConfig {
  rules?: {
    naming?: NamingRuleConfig;
    unused?: RuleConfigBase;
    "semantic-drift"?: SemanticDriftRuleConfig;
  };
  reporter?: ReporterConfig;
}

// ── Resolved config (all required — after defaults applied) ─────────

export interface ResolvedNamingConfig {
  enabled: boolean;
  severity: Severity;
  convention?: string; // undefined = spec-only (no style convention enforced)
}

export interface ResolvedUnusedConfig {
  enabled: boolean;
  severity: Severity;
}

export interface ResolvedSemanticDriftConfig {
  enabled: boolean;
  severity: Severity;
  saturationThreshold: number;
  neutralKeywords: string[];
  brandKeywords: string[];
}

export interface ResolvedReporterConfig {
  maxIssuesPerCategory: number;
}

export interface ResolvedConfig {
  rules: {
    naming: ResolvedNamingConfig;
    unused: ResolvedUnusedConfig;
    "semantic-drift": ResolvedSemanticDriftConfig;
  };
  reporter: ResolvedReporterConfig;
}
