export interface Env {
  LLM_GUARDRAILS_ENV?: string
}

export type GuardrailSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface GuardrailViolation {
  rule: string
  detected: boolean
  severity: GuardrailSeverity
  details: string
}

export interface GuardrailEvaluationRequest {
  text: string
  rules?: string[]
  threshold?: number
}

export interface GuardrailEvaluationResult {
  passed: boolean
  score: number
  violations: GuardrailViolation[]
  flagged_categories: string[]
}

export interface GuardrailRedactRequest {
  text: string
  redact_types?: string[]
  replacement?: string
}

export interface GuardrailRedactResult {
  original_text: string
  redacted_text: string
  replacements_made: number
  redacted_types: string[]
}
