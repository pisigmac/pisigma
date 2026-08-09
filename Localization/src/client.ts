/**
 * Tiny typed client for PiSigma Localization Service.
 * Usage:
 *   const loc = new PisigmaLocalization({ baseUrl })
 *   const geo = await loc.getGeoIP()
 *   const rates = await loc.getRates('EUR')
 *   const tr = await loc.getTranslations('es')
 */
import type { ExchangeRates, GeoIPInfo, TranslationResponse } from './types'

export type LocalizationClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaLocalization {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: LocalizationClientOptions) {
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

  async getGeoIP(ip?: string): Promise<ClientResult<GeoIPInfo>> {
    const queryString = ip ? `?ip=${encodeURIComponent(ip)}` : ''
    const res = await this.fetchFn(`${this.baseUrl}/v1/geoip${queryString}`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as GeoIPInfo,
    }
  }

  async getRates(base = 'USD'): Promise<ClientResult<ExchangeRates>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/rates?base=${encodeURIComponent(base)}`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as ExchangeRates,
    }
  }

  async getTranslations(locale: string): Promise<ClientResult<TranslationResponse>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/translations/${encodeURIComponent(locale)}`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as TranslationResponse,
    }
  }
}
