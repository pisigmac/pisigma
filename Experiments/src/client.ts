/**
 * Typed client SDK for PiSigma Experiments Service.
 */
import type {
  CreateExperimentRequest,
  Experiment,
  GetVariantRequest,
  GetVariantResponse,
  TrackEventRequest,
  TrackEventResponse,
} from './types'

export type ExperimentsClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaExperiments {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: ExperimentsClientOptions) {
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

  async getVariant(req: GetVariantRequest): Promise<ClientResult<GetVariantResponse>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/experiments/variant`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as GetVariantResponse,
    }
  }

  async trackEvent(req: TrackEventRequest): Promise<ClientResult<TrackEventResponse>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/experiments/track`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as TrackEventResponse,
    }
  }

  async createExperiment(req: CreateExperimentRequest): Promise<ClientResult<{ success: boolean; experiment: Experiment }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/experiments`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as { success: boolean; experiment: Experiment },
    }
  }

  async listExperiments(): Promise<ClientResult<{ experiments: Experiment[] }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/experiments`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as { experiments: Experiment[] },
    }
  }
}
