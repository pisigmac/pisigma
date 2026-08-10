/**
 * Typed client SDK for PiSigma APIGenerator Service.
 */
import type { GenerateSchemaRequest, GeneratedSchema, MockDataResponse } from './types'

export type APIGeneratorClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaAPIGenerator {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: APIGeneratorClientOptions) {
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

  async generateSchema(req: GenerateSchemaRequest): Promise<ClientResult<{ success: boolean; schema: GeneratedSchema }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/generator/schema`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as { success: boolean; schema: GeneratedSchema },
    }
  }

  async getMockData(resource: string, options?: { count?: number }): Promise<ClientResult<MockDataResponse>> {
    const query = options?.count ? `?count=${options.count}` : ''
    const res = await this.fetchFn(`${this.baseUrl}/v1/generator/mock/${encodeURIComponent(resource)}${query}`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as MockDataResponse,
    }
  }
}
