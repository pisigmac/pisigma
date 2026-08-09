/**
 * Tiny typed client for PiSigma FeatureFlags Service.
 * Usage:
 *   const flags = new PisigmaFeatureFlags({ baseUrl })
 *   const { flags: evaluated } = await flags.evaluate({ user_id: 'usr_123', flags: ['new_ui_dashboard'] })
 */
export type FeatureFlagsClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type EvaluateFlagsInput = {
  user_id?: string
  flags?: string[]
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaFeatureFlags {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: FeatureFlagsClientOptions) {
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

  async evaluate(input?: EvaluateFlagsInput): Promise<ClientResult<{ user_id: string; flags: Record<string, boolean> }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/evaluate`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input || {}),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        user_id: String(json.user_id),
        flags: (json.flags as Record<string, boolean>) || {},
      },
    }
  }

  async isEnabled(flagKey: string, userId?: string): Promise<boolean> {
    const res = await this.evaluate({ user_id: userId, flags: [flagKey] })
    if (!res.ok) return false
    return Boolean(res.data.flags[flagKey])
  }
}
