/**
 * Tiny typed client for product Workers / Node.
 * Usage:
 *   const wh = new PisigmaWebhooks({ baseUrl, apiKey })
 *   await wh.deliver({ event: 'form.submitted', data: { … } })
 */
export type WebhooksClientOptions = {
  baseUrl: string
  apiKey: string
  fetch?: typeof fetch
}

export type DeliverInput = {
  event: string
  data?: Record<string, unknown>
  endpointId?: string
  url?: string
  secret?: string
  idempotencyKey?: string
}

export type DeliveryResult = {
  id: string
  status: string
  event: string
  url: string
  endpoint_id: string | null
  attempt_count: number
  max_attempts: number
  next_attempt_at: string | null
  last_status_code: number | null
  last_error: string | null
  idempotency_key: string | null
  created_at: string
  updated_at: string
  delivered_at: string | null
}

export type DeliverResult =
  | { ok: true; delivery: DeliveryResult }
  | { ok: true; deliveries: DeliveryResult[]; count: number }
  | { ok: false; status: number; error: string; detail?: unknown }

export type EndpointInput = {
  url: string
  secret: string
  eventTypes?: string[] | null
  description?: string
}

export type EndpointResult = {
  id: string
  url: string
  event_types: string[] | null
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export class PisigmaWebhooks {
  private baseUrl: string
  private apiKey: string
  private fetchFn: typeof fetch

  constructor(opts: WebhooksClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  private authHeaders(extra?: Record<string, string>): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...extra,
    }
  }

  async createEndpoint(input: EndpointInput): Promise<
    | { ok: true; endpoint: EndpointResult }
    | { ok: false; status: number; error: string; detail?: unknown }
  > {
    const res = await this.fetchFn(`${this.baseUrl}/v1/endpoints`, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify({
        url: input.url,
        secret: input.secret,
        event_types: input.eventTypes,
        description: input.description,
      }),
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
    return { ok: true, endpoint: json as unknown as EndpointResult }
  }

  async deliver(input: DeliverInput): Promise<DeliverResult> {
    const headers = this.authHeaders()
    if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey

    const res = await this.fetchFn(`${this.baseUrl}/v1/deliver`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event: input.event,
        data: input.data,
        endpoint_id: input.endpointId,
        url: input.url,
        secret: input.secret,
      }),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok && res.status !== 202) {
      // 502 exhausted still returns a body with id — treat non-ok that isn't delivery shape as error
      if (!json.id) {
        return {
          ok: false,
          status: res.status,
          error: String(json.error || res.statusText),
          detail: json,
        }
      }
    }

    if (Array.isArray(json.deliveries)) {
      return {
        ok: true,
        deliveries: json.deliveries as DeliveryResult[],
        count: Number(json.count || (json.deliveries as unknown[]).length),
      }
    }

    if (json.id) {
      return { ok: true, delivery: json as unknown as DeliveryResult }
    }

    return {
      ok: false,
      status: res.status,
      error: String(json.error || res.statusText),
      detail: json,
    }
  }

  async getDelivery(
    id: string,
  ): Promise<
    | { ok: true; delivery: DeliveryResult }
    | { ok: false; status: number; error: string; detail?: unknown }
  > {
    const res = await this.fetchFn(`${this.baseUrl}/v1/deliveries/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.apiKey}` },
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
    return { ok: true, delivery: json as unknown as DeliveryResult }
  }
}
