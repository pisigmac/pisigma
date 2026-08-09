import { Hono } from 'hono'
import { requireAdmin } from '../auth'
import { mintApiKey, newId } from '../crypto'
import { deliveryPublicResponse } from '../deliver'
import type { DeliveryRow, Env, ProductRow } from '../types'

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
  const limit = Math.max(1, Math.min(100_000, body.rate_limit_per_hour ?? 2000))
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

adminRoutes.get('/products/:slug/deliveries', async (c) => {
  const slug = c.req.param('slug')
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 25)))
  const status = c.req.query('status')?.trim()

  const product = await c.env.DB.prepare(`SELECT id FROM products WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string }>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  let sql = `SELECT * FROM deliveries WHERE product_id = ?`
  const binds: (string | number)[] = [product.id]
  if (status) {
    sql += ` AND status = ?`
    binds.push(status)
  }
  sql += ` ORDER BY created_at DESC LIMIT ?`
  binds.push(limit)

  const { results } = await c.env.DB.prepare(sql)
    .bind(...binds)
    .all<DeliveryRow>()

  return c.json({
    deliveries: (results || []).map(deliveryPublicResponse),
  })
})

adminRoutes.get('/deliveries', async (c) => {
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 25)))
  const status = c.req.query('status')?.trim()

  let sql = `SELECT * FROM deliveries`
  const binds: (string | number)[] = []
  if (status) {
    sql += ` WHERE status = ?`
    binds.push(status)
  }
  sql += ` ORDER BY created_at DESC LIMIT ?`
  binds.push(limit)

  const { results } = await c.env.DB.prepare(sql)
    .bind(...binds)
    .all<DeliveryRow>()

  return c.json({
    deliveries: (results || []).map(deliveryPublicResponse),
  })
})
