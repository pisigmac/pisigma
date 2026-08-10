/**
 * Typed client SDK for PiSigma Feedback Service.
 */
import type { FeedbackItem, FeedbackSummary, SubmitFeedbackRequest, SubmitFeedbackResponse } from './types'

export type FeedbackClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaFeedback {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: FeedbackClientOptions) {
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

  async submitFeedback(req: SubmitFeedbackRequest): Promise<ClientResult<SubmitFeedbackResponse>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/feedback/submit`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as SubmitFeedbackResponse,
    }
  }

  async getSummary(category?: string): Promise<ClientResult<FeedbackSummary>> {
    const url = category
      ? `${this.baseUrl}/v1/feedback/summary?category=${encodeURIComponent(category)}`
      : `${this.baseUrl}/v1/feedback/summary`
    const res = await this.fetchFn(url, { headers: this.headers() })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as FeedbackSummary,
    }
  }

  async getFeedbackItems(category?: string): Promise<ClientResult<{ items: FeedbackItem[] }>> {
    const url = category
      ? `${this.baseUrl}/v1/feedback/items?category=${encodeURIComponent(category)}`
      : `${this.baseUrl}/v1/feedback/items`
    const res = await this.fetchFn(url, { headers: this.headers() })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as { items: FeedbackItem[] },
    }
  }
}
