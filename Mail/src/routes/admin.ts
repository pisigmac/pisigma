import { Hono } from 'hono'
import { requireAdmin } from '../auth'
import { mintApiKey, newId } from '../crypto'
import type { Env, ProductRow, TemplateRow } from '../types'

type App = { Bindings: Env }

export const adminRoutes = new Hono<App>()

adminRoutes.use('*', requireAdmin)

adminRoutes.get('/products', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, slug, name, allowed_from, rate_limit_per_hour, active, created_at FROM products ORDER BY created_at`,
  ).all<ProductRow>()
  return c.json({
    products: (results || []).map((p) => ({
      ...p,
      allowed_from: JSON.parse(p.allowed_from || '[]'),
      active: !!p.active,
    })),
  })
})

adminRoutes.post('/products', async (c) => {
  const body = await c.req.json<{
    slug: string
    name: string
    allowed_from?: string[]
    rate_limit_per_hour?: number
  }>()

  const slug = (body.slug || '').trim().toLowerCase()
  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(slug)) {
    return c.json({ error: 'invalid_slug' }, 400)
  }
  const name = (body.name || slug).trim()
  const allowed = JSON.stringify(body.allowed_from ?? ['*'])
  const limit = Math.max(1, Math.min(100_000, body.rate_limit_per_hour ?? 500))
  const id = newId('prod')

  try {
    await c.env.DB.prepare(
      `INSERT INTO products (id, slug, name, allowed_from, rate_limit_per_hour) VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(id, slug, name, allowed, limit)
      .run()
  } catch {
    return c.json({ error: 'slug_taken' }, 409)
  }

  return c.json({ id, slug, name, allowed_from: JSON.parse(allowed), rate_limit_per_hour: limit }, 201)
})

adminRoutes.patch('/products/:slug', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(`SELECT * FROM products WHERE slug = ?`)
    .bind(slug)
    .first<ProductRow>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const body = await c.req.json<{
    name?: string
    allowed_from?: string[]
    rate_limit_per_hour?: number
    active?: boolean
  }>()

  const name = body.name?.trim() || product.name
  const allowed =
    body.allowed_from != null ? JSON.stringify(body.allowed_from) : product.allowed_from
  const limit =
    body.rate_limit_per_hour != null
      ? Math.max(1, Math.min(100_000, body.rate_limit_per_hour))
      : product.rate_limit_per_hour
  const active = body.active == null ? product.active : body.active ? 1 : 0

  await c.env.DB.prepare(
    `UPDATE products SET name = ?, allowed_from = ?, rate_limit_per_hour = ?, active = ? WHERE id = ?`,
  )
    .bind(name, allowed, limit, active, product.id)
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

adminRoutes.put('/products/:slug/templates/:templateId', async (c) => {
  const slug = c.req.param('slug')
  const templateId = c.req.param('templateId')
  if (!/^[a-z0-9][a-z0-9_.-]{0,63}$/i.test(templateId)) {
    return c.json({ error: 'invalid_template_id' }, 400)
  }

  const product = await c.env.DB.prepare(`SELECT id FROM products WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string }>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const body = await c.req.json<{ subject: string; html?: string; text?: string }>()
  if (!body.subject?.trim()) return c.json({ error: 'subject_required' }, 400)
  if (!body.html && !body.text) return c.json({ error: 'html_or_text_required' }, 400)

  await c.env.DB.prepare(
    `INSERT INTO templates (id, product_id, subject, html, text, updated_at)
     VALUES (?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
     ON CONFLICT(product_id, id) DO UPDATE SET
       subject = excluded.subject,
       html = excluded.html,
       text = excluded.text,
       updated_at = excluded.updated_at`,
  )
    .bind(templateId, product.id, body.subject.trim(), body.html ?? null, body.text ?? null)
    .run()

  return c.json({ ok: true, id: templateId })
})

adminRoutes.get('/products/:slug/templates', async (c) => {
  const slug = c.req.param('slug')
  const product = await c.env.DB.prepare(`SELECT id FROM products WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string }>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const { results } = await c.env.DB.prepare(
    `SELECT id, subject, html, text, updated_at FROM templates WHERE product_id = ? ORDER BY id`,
  )
    .bind(product.id)
    .all<TemplateRow>()

  return c.json({ templates: results || [] })
})

adminRoutes.get('/products/:slug/messages', async (c) => {
  const slug = c.req.param('slug')
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 25)))
  const product = await c.env.DB.prepare(`SELECT id FROM products WHERE slug = ?`)
    .bind(slug)
    .first<{ id: string }>()
  if (!product) return c.json({ error: 'not_found' }, 404)

  const { results } = await c.env.DB.prepare(
    `SELECT id, to_addrs, from_addr, subject, status, provider, provider_id, error, template_id, created_at
     FROM messages WHERE product_id = ? ORDER BY created_at DESC LIMIT ?`,
  )
    .bind(product.id, limit)
    .all()

  return c.json({
    messages: (results || []).map((m) => ({
      ...m,
      to: JSON.parse(String(m.to_addrs || '[]')),
    })),
  })
})
