/**
 * Tiny typed client for PiSigma Notifications Service.
 * Usage:
 *   const notifs = new PisigmaNotifications({ baseUrl })
 *   await notifs.sendPush({ user_id: 'usr_1', title: 'Order Update', body: 'Your package is on the way' })
 */
export type NotificationsClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type RegisterDeviceInput = {
  user_id: string
  device_token: string
  platform: 'web' | 'android' | 'ios'
}

export type SendPushInput = {
  user_id: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaNotifications {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: NotificationsClientOptions) {
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

  async registerDevice(input: RegisterDeviceInput): Promise<ClientResult<{ success: boolean; registered_devices: number }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/devices/register`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return { ok: true, data: { success: Boolean(json.success), registered_devices: Number(json.registered_devices) } }
  }

  async sendPush(input: SendPushInput): Promise<ClientResult<{ success: boolean; notification_id: string }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/push/send`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return { ok: true, data: { success: Boolean(json.success), notification_id: String(json.notification_id) } }
  }

  async getFeed(userId: string): Promise<ClientResult<{ user_id: string; notifications: unknown[] }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/feed/${encodeURIComponent(userId)}`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return { ok: true, data: { user_id: String(json.user_id), notifications: (json.notifications as unknown[]) || [] } }
  }
}
