/**
 * Tiny typed client for product Workers / Node.
 * Usage:
 *   const billing = new PisigmaBilling({ baseUrl, apiKey })
 *   await billing.createOrder({ plan: 'pro', idempotencyKey: '…' })
 */
export type BillingClientOptions = {
  baseUrl: string
  apiKey: string
  fetch?: typeof fetch
}

export type CreateOrderInput = {
  plan?: string
  amount_paise?: number
  currency?: string
  receipt?: string
  notes?: Record<string, string>
  metadata?: Record<string, unknown>
  description?: string
  idempotencyKey?: string
}

export type VerifyInput = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaBilling {
  private baseUrl: string
  private apiKey: string
  private fetchFn: typeof fetch

  constructor(opts: BillingClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...extra,
    }
  }

  async createOrder(input: CreateOrderInput): Promise<
    ClientResult<{
      id: string
      status: string
      order_id: string | null
      key_id: string | null
      amount: number
      currency: string
      plan?: string | null
      mode?: string
    }>
  > {
    const headers = this.headers()
    if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey

    const { idempotencyKey: _ik, ...body } = input
    const res = await this.fetchFn(`${this.baseUrl}/v1/orders`, {
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
      data: {
        id: String(json.id),
        status: String(json.status),
        order_id: (json.order_id as string | null) ?? null,
        key_id: (json.key_id as string | null) ?? null,
        amount: Number(json.amount),
        currency: String(json.currency || 'INR'),
        plan: (json.plan as string | null | undefined) ?? null,
        mode: json.mode ? String(json.mode) : undefined,
      },
    }
  }

  async verify(input: VerifyInput): Promise<ClientResult<{ ok: true; payment: unknown }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/verify`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
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
    return { ok: true, data: { ok: true, payment: json.payment } }
  }

  async getPayment(id: string): Promise<ClientResult<Record<string, unknown>>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/payments/${encodeURIComponent(id)}`, {
      headers: this.headers(),
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
    return { ok: true, data: json }
  }

  async listPayments(limit = 25): Promise<ClientResult<{ payments: unknown[] }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/payments?limit=${limit}`, {
      headers: this.headers(),
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
    return { ok: true, data: { payments: (json.payments as unknown[]) || [] } }
  }

  async listPlans(): Promise<ClientResult<{ plans: unknown[] }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/plans`, {
      headers: this.headers(),
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
    return { ok: true, data: { plans: (json.plans as unknown[]) || [] } }
  }
}
