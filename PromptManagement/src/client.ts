/**
 * Typed client SDK for PiSigma PromptManagement Service.
 */
import type {
  PromptTemplate,
  PromptRenderRequest,
  PromptRenderResult,
  PromptVersionRequest,
  PromptVersionResult,
} from './types'

export type PromptManagementClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaPromptManagement {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: PromptManagementClientOptions) {
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

  async renderPrompt(req: PromptRenderRequest): Promise<ClientResult<PromptRenderResult>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/prompts/render`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as PromptRenderResult,
    }
  }

  async createVersion(req: PromptVersionRequest): Promise<ClientResult<PromptVersionResult>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/prompts/version`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as PromptVersionResult,
    }
  }

  async getPrompts(): Promise<ClientResult<{ prompts: PromptTemplate[] }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/prompts`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as { prompts: PromptTemplate[] },
    }
  }

  async getPromptById(id: string): Promise<ClientResult<{ prompt: PromptTemplate }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/prompts/${encodeURIComponent(id)}`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as { prompt: PromptTemplate },
    }
  }
}
