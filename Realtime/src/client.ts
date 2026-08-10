/**
 * Typed client SDK for PiSigma Realtime Service.
 */
import type {
  GetPresenceResponse,
  PresenceItem,
  PresenceRequest,
  PublishMessageRequest,
  PublishMessageResponse,
  RealtimeMessage,
} from './types'

export type RealtimeClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaRealtime {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: RealtimeClientOptions) {
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

  async publish(req: PublishMessageRequest): Promise<ClientResult<PublishMessageResponse>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/realtime/publish`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as PublishMessageResponse,
    }
  }

  async getPresence(channel: string = 'global'): Promise<ClientResult<GetPresenceResponse>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/realtime/presence?channel=${encodeURIComponent(channel)}`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as GetPresenceResponse,
    }
  }

  async updatePresence(req: PresenceRequest): Promise<ClientResult<{ success: boolean; presence: PresenceItem }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/realtime/presence`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(req),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as { success: boolean; presence: PresenceItem },
    }
  }

  async getMessages(channel: string): Promise<ClientResult<{ channel: string; messages: RealtimeMessage[] }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/realtime/messages?channel=${encodeURIComponent(channel)}`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: json as unknown as { channel: string; messages: RealtimeMessage[] },
    }
  }
}
