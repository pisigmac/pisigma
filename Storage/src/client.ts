/**
 * Tiny typed client for PiSigma Storage Service.
 * Usage:
 *   const storage = new PisigmaStorage({ baseUrl, apiKey })
 *   const { upload_url } = await storage.getPresignedUploadUrl({ filename: 'avatar.png', mime_type: 'image/png', size_bytes: 1024 })
 */
export type StorageClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type PresignedUploadInput = {
  filename: string
  mime_type: string
  size_bytes: number
  ttl_seconds?: number
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaStorage {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: StorageClientOptions) {
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

  async getPresignedUploadUrl(input: PresignedUploadInput): Promise<ClientResult<{ file_id: string; upload_url: string; expires_at: number }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/uploads/presigned`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        file_id: String(json.file_id),
        upload_url: String(json.upload_url),
        expires_at: Number(json.expires_at),
      },
    }
  }

  async getPresignedDownloadUrl(fileId: string, ttlSeconds = 3600): Promise<ClientResult<{ download_url: string; expires_at: number }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/downloads/presigned`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ file_id: fileId, ttl_seconds: ttlSeconds }),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        download_url: String(json.download_url),
        expires_at: Number(json.expires_at),
      },
    }
  }
}
