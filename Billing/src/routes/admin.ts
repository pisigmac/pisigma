import { Hono } from 'hono'
import { requireAdmin } from '../auth'
import { mintApiKey, newId } from '../crypto'
import { isValidPlanInterval } from '../policy'
import type { Env, PaymentRow, PlanRow, ProductRow } from '../types'

type App = { Bindings: Env }

export const adminRoutes = new Hono<App>()

adminRoutes.use('*', requireAdmin)

adminRoutes.get('/products', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, slug, name, rate_limit_per_hour, active, created_at FROM products ORDER BY created_at`,
  ).all<ProductRow>()
  return c.json({
    products: (results || []).map((p) => ({
      ...p,
      active: !!p.active,
    })),
  })
})

adminRoutes.post('/products', async (c) => {
  const body = await c.req.json<{
    slug: string
    name: string
    rate_limit_per_hour?: number
  }>()

  const slug = (body.slug || '').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(slug)) {
    return c.json({ error: 'invalid_slug' }, 400)
  }
  const name = (body.name || slug).trim()
  const limit = Math.max(1, Math.min(100_000, body.rate_limit_per_hour ?? 200))
  const id = newId('prod')

  try {
    await c.env.DB.prepare(
      `INSERT INTO products (id, slug, name, rate_limit_per_hour) VALUES (?, ?, ?, ?)`,
    )
      .bind(id, slug, name, limit)
      .run()
  } catch {
    return c.json({ error: 'slug_taken' }, 409)
  }

  return c.json({ id, slug, name, rate_limit_per_hour: limit }, 201)
})

adminRoutes.patch('/products/:slug', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(`SELECT * FROM products WHERE slug = ?`)
    .bind(slug)
    .first<ProductRow>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const body = await c.req.json<{
    name?: string
    rate_limit_per_hour?: number
    active?: boolean
  }>()

  const name = body.name?.trim() || product.name
  const limit =
    body.rate_limit_per_hour != null
      ? Math.max(1, Math.min(100_000, body.rate_limit_per_hour))
      : product.rate_limit_per_hour
  const active = body.active == null ? product.active : body.active ? 1 : 0

  await c.env.DB.prepare(
    `UPDATE products SET name = ?, rate_limit_per_hour = ?, active = ? WHERE id = ?`,
  )
    .bind(name, limit, active, product.id)
    .run()

  return c.json({ ok: true })
})

adminRoutes.post('/products/:slug/keys', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(`SELECT * FROM products WHERE slug = ?`)
    .bind(slug)
    .first<ProductRow>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const body = (await c.req.json<{ name?: string; environment?: 'live' | 'test' }>().catch(() => ({}))) as {
    name?: string
    environment?: 'live' | 'test'
  }
  const environment = body.environment === 'test' ? 'test' : 'live'
  const name = (body.name || `${environment} key`).trim()
  const minted = await mintApiKey(environment)
  const id = newId('key')

  await c.env.DB.prepare(
    `INSERT INTO api_keys (id, product_id, name, key_prefix, key_hash, environment) VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, product.id, name, minted.prefix, minted.hash, environment)
    .run()

  return c.json(
    {
      id,
      name,
      environment,
      key: minted.raw,
      prefix: minted.prefix,
      warning: 'Store this key now — it will not be shown again.',
    },
    201,
  )
})

adminRoutes.post('/products/:slug/keys/:keyId/revoke', async (c) => {
  const slug = c.req.param('slug')
  const keyId = c.req.param('keyId')
  const product = await c.env.DB.prepare(`SELECT id FROM products WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string }>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const res = await c.env.DB.prepare(
    `UPDATE api_keys SET revoked_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ? AND product_id = ? AND revoked_at IS NULL`,
  )
    .bind(keyId, product.id)
    .run()

  if (!res.meta.changes) return c.json({ error: 'not_found' }, 404)
  return c.json({ ok: true })
})

adminRoutes.get('/products/:slug/plans', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(`SELECT id FROM products WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string }>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const { results } = await c.env.DB.prepare(
    `SELECT id, slug, name, amount_paise, currency, interval, active, created_at
     FROM plans WHERE product_id = ? ORDER BY amount_paise`,
  )
    .bind(product.id)
    .all<PlanRow>()

  return c.json({
    plans: (results || []).map((p) => ({ ...p, active: !!p.active })),
  })
})

adminRoutes.post('/products/:slug/plans', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(`SELECT id FROM products WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string }>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const body = await c.req.json<{
    slug: string
    name: string
    amount_paise: number
    currency?: string
    interval?: string
  }>()

  const planSlug = (body.slug || '').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(planSlug)) {
    return c.json({ error: 'invalid_plan_slug' }, 400)
  }
  const name = (body.name || planSlug).trim()
  const amount = Number(body.amount_paise)
  if (!Number.isInteger(amount) || amount < 100) {
    return c.json({ error: 'invalid_amount_paise', detail: 'Minimum 100 paise (₹1)' }, 400)
  }
  const currency = (body.currency || 'INR').toUpperCase()
  if (currency !== 'INR') {
    return c.json({ error: 'unsupported_currency', detail: 'Only INR for now' }, 400)
  }
  const interval = body.interval || 'month'
  if (!isValidPlanInterval(interval)) {
    return c.json({ error: 'invalid_interval', detail: 'month | year | one_time' }, 400)
  }

  const id = newId('plan')
  try {
    await c.env.DB.prepare(
      `INSERT INTO plans (id, product_id, slug, name, amount_paise, currency, interval)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(id, product.id, planSlug, name, amount, currency, interval)
      .run()
  } catch {
    return c.json({ error: 'plan_slug_taken' }, 409)
  }

  return c.json(
    { id, slug: planSlug, name, amount_paise: amount, currency, interval, active: true },
    201,
  )
})

adminRoutes.patch('/products/:slug/plans/:planSlug', async (c) => {
  const slug = c.req.param('slug')
  const planSlug = c.req.param('planSlug')
  const product = await c.env.DB.prepare(`SELECT id FROM products WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string }>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const plan = await c.env.DB.prepare(
    `SELECT * FROM plans WHERE product_id = ? AND slug = ? LIMIT 1`,
  )
    .bind(product.id, planSlug)
    .first<PlanRow>()
  if (!plan) return c.json({ error: 'plan_not_found' }, 404)

  const body = await c.req.json<{
    name?: string
    amount_paise?: number
    interval?: string
    active?: boolean
  }>()

  const name = body.name?.trim() || plan.name
  let amount = plan.amount_paise
  if (body.amount_paise != null) {
    amount = Number(body.amount_paise)
    if (!Number.isInteger(amount) || amount < 100) {
      return c.json({ error: 'invalid_amount_paise' }, 400)
    }
  }
  let interval = plan.interval
  if (body.interval != null) {
    if (!isValidPlanInterval(body.interval)) {
      return c.json({ error: 'invalid_interval' }, 400)
    }
    interval = body.interval
  }
  const active = body.active == null ? plan.active : body.active ? 1 : 0

  await c.env.DB.prepare(
    `UPDATE plans SET name = ?, amount_paise = ?, interval = ?, active = ? WHERE id = ?`,
  )
    .bind(name, amount, interval, active, plan.id)
    .run()

  return c.json({ ok: true })
})

adminRoutes.get('/products/:slug/payments', async (c) => {
  const slug = c.req.param('slug')
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 25)))
  const product = await c.env.DB.prepare(`SELECT id FROM products WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string }>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const { results } = await c.env.DB.prepare(
    `SELECT id, plan_slug, amount_paise, currency, status, razorpay_order_id,
            razorpay_payment_id, confirmed_at, created_at
     FROM payments WHERE product_id = ? ORDER BY created_at DESC LIMIT ?`,
  )
    .bind(product.id, limit)
    .all<PaymentRow>()

  return c.json({ payments: results || [] })
})
