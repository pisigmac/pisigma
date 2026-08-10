/**
 * Typed client SDK for PiSigma ErrorTracking Service.
 */
import type { CaptureErrorRequest, ErrorEvent, ErrorSummary } from './types'

export type ErrorTrackingClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaErrorTracking {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: ErrorTrackingClientOptions) {
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

  async captureError(req: CaptureErrorRequest): Promise<ClientResult<{ success: boolean; event: ErrorEvent }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/errors/capture`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as { success: boolean; event: ErrorEvent },
    }
  }

  async getSummary(filters?: { service?: string; level?: string }): Promise<ClientResult<ErrorSummary>> {
    const params = new URLSearchParams()
    if (filters?.service) params.set('service', filters.service)
    if (filters?.level) params.set('level', filters.level)
    const query = params.toString() ? `?${params.toString()}` : ''

    const res = await this.fetchFn(`${this.baseUrl}/v1/errors/summary${query}`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as ErrorSummary,
    }
  }
}
