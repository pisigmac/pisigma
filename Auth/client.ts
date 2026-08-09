/**
 * Tiny typed client for PiSigma Auth Service (FastAPI / Python backend).
 * Usage:
 *   const auth = new PisigmaAuth({ baseUrl: 'http://127.0.0.1:8090' })
 *   const { token } = await auth.login({ email: 'user@example.com', password: 'secretpassword' })
 */
export type AuthClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type LoginInput = {
  email: string
  password?: string
  provider?: string
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaAuth {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: AuthClientOptions) {
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
    return { ok: true, data: { status: String(json.status), service: 'pisigma-auth' } }
  }

  async login(input: LoginInput): Promise<ClientResult<{ token: string; user: Record<string, unknown> }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/auth/login`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        token: String(json.access_token || json.token || ''),
        user: (json.user as Record<string, unknown>) || {},
      },
    }
  }

  async me(token: string): Promise<ClientResult<{ user_id: string; email: string }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/auth/me`, {
      headers: {
        ...this.headers(),
        Authorization: `Bearer ${token}`,
      },
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        user_id: String(json.id || json.user_id),
        email: String(json.email),
      },
    }
  }
}
