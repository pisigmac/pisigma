/**
 * Typed client for PiSigma SSO Service.
 * Usage:
 *   const sso = new PisigmaSSO({ baseUrl })
 *   const providers = await sso.getProviders()
 *   const authResult = await sso.authenticate({ provider_id: 'google', token: 'xyz' })
 */
import type { SSOAuthRequest, SSOAuthResponse, SSOProvider } from './types'

export type SSOClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaSSO {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: SSOClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`
    return h
  }

  async checkHealth(): Promise<ClientResult<{ status: string; service: string; environment?: string; total_providers?: number }>> {
    const res = await this.fetchFn(`${this.baseUrl}/health`)
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        status: String(json.status),
        service: String(json.service),
        environment: json.environment ? String(json.environment) : undefined,
        total_providers: typeof json.total_providers === 'number' ? json.total_providers : undefined,
      },
    }
  }

  async getProviders(): Promise<ClientResult<{ providers: SSOProvider[] }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/sso/providers`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        providers: (json.providers as SSOProvider[]) || [],
      },
    }
  }

  async authenticate(input: SSOAuthRequest): Promise<ClientResult<SSOAuthResponse>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/sso/auth`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })
    const json = (await res.json().catch(() => ({}))) as SSOAuthResponse
    if (!res.ok) return { ok: false, status: res.status, error: json.error || res.statusText }
    return {
      ok: true,
      data: json,
    }
  }
}
