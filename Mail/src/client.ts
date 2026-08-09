/**
 * Tiny typed client for product Workers / Node.
 * Usage:
 *   const mail = new PisigmaMail({ baseUrl, apiKey })
 *   await mail.send({ to, subject, text })
 */
export type MailClientOptions = {
  baseUrl: string
  apiKey: string
  fetch?: typeof fetch
}

export type SendInput = {
  to: string | string[]
  subject?: string
  html?: string
  text?: string
  template?: string
  data?: Record<string, unknown>
  from?: string
  reply_to?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  idempotencyKey?: string
}

export type SendResult =
  | { ok: true; id: string; status: string; provider?: string; provider_id?: string | null }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaMail {
  private baseUrl: string
  private apiKey: string
  private fetchFn: typeof fetch

  constructor(opts: MailClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  async send(input: SendInput): Promise<SendResult> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    }
    if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey

    const { idempotencyKey: _ik, ...body } = input
    const res = await this.fetchFn(`${this.baseUrl}/v1/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: String(json.error || res.statusText),
        detail: json,
      }
    }
    return {
      ok: true,
      id: String(json.id),
      status: String(json.status),
      provider: json.provider ? String(json.provider) : undefined,
      provider_id: (json.provider_id as string | null | undefined) ?? null,
    }
  }
}
