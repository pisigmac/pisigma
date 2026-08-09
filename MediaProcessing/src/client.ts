/**
 * Tiny typed client for PiSigma Media Processing Service.
 * Usage:
 *   const media = new PisigmaMediaProcessing({ baseUrl: 'http://127.0.0.1:8802', apiKey: 'secret' })
 *   const presets = await media.getPresets()
 *   const result = await media.transformMedia({ source_url: 'https://...', target_format: 'webp' })
 */

export type MediaProcessingClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type MediaTransformInput = {
  source_url: string
  target_format: 'jpeg' | 'png' | 'webp' | 'gif' | 'mp4' | 'mp3' | 'wav'
  width?: number
  height?: number
  quality?: number
  preset?: string
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaMediaProcessing {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: MediaProcessingClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`
    return h
  }

  async checkHealth(): Promise<ClientResult<{ status: string; service: string; engine: string }>> {
    const res = await this.fetchFn(`${this.baseUrl}/health`)
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        status: String(json.status),
        service: String(json.service),
        engine: String(json.engine),
      },
    }
  }

  async getPresets(): Promise<ClientResult<{ presets: Array<Record<string, unknown>>; count: number }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/media/presets`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        presets: (json.presets as Array<Record<string, unknown>>) || [],
        count: Number(json.count || 0),
      },
    }
  }

  async transformMedia(
    input: MediaTransformInput
  ): Promise<ClientResult<{ job_id: string; status: string; output_url: string; target_format: string }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/media/transform`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        job_id: String(json.job_id),
        status: String(json.status),
        output_url: String(json.output_url),
        target_format: String(json.target_format),
      },
    }
  }
}
