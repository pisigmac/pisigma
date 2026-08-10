/**
 * Typed client SDK for PiSigma LLMGuardrails Service.
 */
import type {
  GuardrailEvaluationRequest,
  GuardrailEvaluationResult,
  GuardrailRedactRequest,
  GuardrailRedactResult,
} from './types'

export type LLMGuardrailsClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaLLMGuardrails {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: LLMGuardrailsClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`
    return h
  }

  async checkHealth(): Promise<ClientResult<{ status: string; service: string; environment?: string }>> {
    const res = await this.fetchFn(`${this.baseUrl}/health`)
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        status: String(json.status),
        service: String(json.service),
        environment: json.environment ? String(json.environment) : undefined,
      },
    }
  }

  async evaluateGuardrails(req: GuardrailEvaluationRequest): Promise<ClientResult<GuardrailEvaluationResult>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/guardrails/evaluate`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as GuardrailEvaluationResult,
    }
  }

  async redactText(req: GuardrailRedactRequest): Promise<ClientResult<GuardrailRedactResult>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/guardrails/redact`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as GuardrailRedactResult,
    }
  }
}
