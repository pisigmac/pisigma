import { Hono } from 'hono'
import { requireAdmin, requireProductKey } from '../auth'
import { newId } from '../crypto'
import { attemptDelivery, deliveryPublicResponse, processDueRetries } from '../deliver'
import { assertWithinRateLimit, endpointMatchesEvent, isHttpUrl } from '../policy'
import type {
  AuthContext,
  DeliverRequest,
  DeliveryRow,
  EndpointRow,
  Env,
} from '../types'

type App = { Bindings: Env; Variables: { auth: AuthContext } }

export const deliverRoutes = new Hono<App>()

deliverRoutes.post('/deliver', requireProductKey, async (c) => {
  const auth = c.get('auth')
  const body = await c.req.json<DeliverRequest>().catch(() => null)
  if (!body) return c.json({ error: 'invalid_json' }, 400)

  const event = (body.event || '').trim()
  if (!event || event.length > 128) {
    return c.json({ error: 'event_required', detail: 'event must be 1–128 characters' }, 400)
  }

  const data = body.data && typeof body.data === 'object' && !Array.isArray(body.data) ? body.data : {}

  const idempotencyKey = c.req.header('Idempotency-Key')?.trim() || null
  if (idempotencyKey) {
    if (idempotencyKey.length > 128) {
      return c.json({ error: 'idempotency_key_too_long' }, 400)
    }
    const existing = await c.env.DB.prepare(
      `SELECT * FROM deliveries WHERE product_id = ? AND idempotency_key = ? LIMIT 1`,
    )
      .bind(auth.product.id, idempotencyKey)
      .first<DeliveryRow>()
    if (existing) {
      return c.json(deliveryPublicResponse(existing), existing.status === 'exhausted' ? 502 : 200)
    }
  }

  type Target = { endpoint_id: string | null; url: string; secret: string }
  const targets: Target[] = []

  if (body.endpoint_id) {
    const ep = await c.env.DB.prepare(
      `SELECT * FROM endpoints WHERE id = ? AND product_id = ? AND active = 1 LIMIT 1`,
    )
      .bind(body.endpoint_id, auth.product.id)
      .first<EndpointRow>()
    if (!ep) return c.json({ error: 'endpoint_not_found' }, 404)
    if (!endpointMatchesEvent(ep.event_types, event)) {
      return c.json({ error: 'event_not_allowed_for_endpoint' }, 400)
    }
    targets.push({ endpoint_id: ep.id, url: ep.url, secret: ep.secret })
  } else if (body.url) {
    const url = body.url.trim()
    if (!isHttpUrl(url)) return c.json({ error: 'invalid_url' }, 400)
    const secret = (body.secret || '').trim()
    if (secret.length < 8) {
      return c.json({ error: 'secret_required', detail: 'ad-hoc url requires secret (8+ chars)' }, 400)
    }
    targets.push({ endpoint_id: null, url, secret })
  } else {
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM endpoints WHERE product_id = ? AND active = 1`,
    )
      .bind(auth.product.id)
      .all<EndpointRow>()
    for (const ep of results || []) {
      if (endpointMatchesEvent(ep.event_types, event)) {
        targets.push({ endpoint_id: ep.id, url: ep.url, secret: ep.secret })
      }
    }
    if (!targets.length) {
      return c.json({ error: 'no_matching_endpoints' }, 404)
    }
  }

  // Rate limit once per deliver call (not per fan-out target)
  const rate = await assertWithinRateLimit(c.env.DB, auth.product)
  if (!rate.ok) {
    return c.json(
      { error: 'rate_limited', limit: rate.limit, used: rate.used, window: 'hour' },
      429,
    )
  }

  // Idempotency unique index is per single row — fan-out with idempotency only allowed for 1 target
  if (idempotencyKey && targets.length > 1) {
    return c.json(
      {
        error: 'idempotency_requires_single_target',
        detail: 'Provide endpoint_id or url when using Idempotency-Key with fan-out',
      },
      400,
    )
  }

  const deliveries: DeliveryRow[] = []

  for (const target of targets) {
    const id = newId('dlv')
    const createdAt = new Date().toISOString()
    const payloadObj = {
      id,
      event,
      data,
      created_at: createdAt,
    }
    const payload = JSON.stringify(payloadObj)

    // Insert as pending before first attempt
    try {
      await c.env.DB.prepare(
        `INSERT INTO deliveries (
          id, product_id, api_key_id, endpoint_id, url, signing_secret, event, payload,
          status, attempt_count, max_attempts, next_attempt_at, idempotency_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 4, NULL, ?)`,
      )
        .bind(
          id,
          auth.product.id,
          auth.key.id,
          target.endpoint_id,
          target.url,
          target.secret,
          event,
          payload,
          idempotencyKey,
        )
        .run()
    } catch (e) {
      if (idempotencyKey) {
        const existing = await c.env.DB.prepare(
          `SELECT * FROM deliveries WHERE product_id = ? AND idempotency_key = ? LIMIT 1`,
        )
          .bind(auth.product.id, idempotencyKey)
          .first<DeliveryRow>()
        if (existing) return c.json(deliveryPublicResponse(existing), 200)
      }
      throw e
    }

    let row = await c.env.DB.prepare(`SELECT * FROM deliveries WHERE id = ?`)
      .bind(id)
      .first<DeliveryRow>()
    if (!row) throw new Error('delivery_insert_failed')

    row = await attemptDelivery(c.env, row)
    deliveries.push(row)
  }

  if (deliveries.length === 1) {
    const d = deliveries[0]!
    const status =
      d.status === 'delivered' ? 202 : d.status === 'exhausted' ? 502 : 202
    return c.json(deliveryPublicResponse(d), status)
  }

  return c.json(
    {
      deliveries: deliveries.map(deliveryPublicResponse),
      count: deliveries.length,
    },
    202,
  )
})

deliverRoutes.get('/deliveries/:id', requireProductKey, async (c) => {
  const auth = c.get('auth')
  const row = await c.env.DB.prepare(
    `SELECT * FROM deliveries WHERE id = ? AND product_id = ? LIMIT 1`,
  )
    .bind(c.req.param('id'), auth.product.id)
    .first<DeliveryRow>()
  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json(deliveryPublicResponse(row))
})

/** Cron alternative: POST /v1/internal/retry with admin token. */
export const internalRoutes = new Hono<{ Bindings: Env }>()

internalRoutes.post('/retry', requireAdmin, async (c) => {
  const limit = Math.min(200, Math.max(1, Number(c.req.query('limit') || 50)))
  const result = await processDueRetries(c.env, limit)
  return c.json({ ok: true, ...result })
})
