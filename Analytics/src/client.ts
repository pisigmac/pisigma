/**
 * Tiny typed client for PiSigma Analytics Service.
 * Usage:
 *   const analytics = new PisigmaAnalytics({ baseUrl })
 *   await analytics.track({ event_name: 'button_click', user_id: 'usr_1', properties: { page: 'checkout' } })
 */
export type AnalyticsClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type TrackEventInput = {
  event_name: string
  user_id?: string
  tenant_id?: string
  properties?: Record<string, unknown>
  timestamp?: string
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaAnalytics {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: AnalyticsClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`
    return h
  }

  async checkHealth(): Promise<ClientResult<{ status: string; service: string }>> {
    const res = await this.fetchFn(`${this.baseUrl}/health`)
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return { ok: true, data: { status: String(json.status), service: String(json.service) } }
  }

  async track(input: TrackEventInput): Promise<ClientResult<{ success: boolean; total: number }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/events`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return { ok: true, data: { success: Boolean(json.success), total: Number(json.total) } }
  }

  async trackBatch(events: TrackEventInput[]): Promise<ClientResult<{ success: boolean; ingested: number; total: number }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/events`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ events }),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        success: Boolean(json.success),
        ingested: Number(json.ingested),
        total: Number(json.total),
      },
    }
  }
}
