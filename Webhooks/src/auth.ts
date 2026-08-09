import type { Context, Next } from 'hono'
import { parseBearer, sha256Hex, timingSafeEqual } from './crypto'
import type { ApiKeyRow, AuthContext, Env, ProductRow } from './types'

type AppVars = { auth: AuthContext }

export async function requireProductKey(c: Context<{ Bindings: Env; Variables: AppVars }>, next: Next) {
  const token = parseBearer(c.req.header('Authorization'))
  if (!token || !token.startsWith('pw_')) {
    return c.json({ error: 'missing_or_invalid_api_key' }, 401)
  }

  const hash = await sha256Hex(token)
  const prefix = token.slice(0, 14)

  const key = await c.env.DB.prepare(
    `SELECT * FROM api_keys WHERE key_prefix = ? AND key_hash = ? AND revoked_at IS NULL LIMIT 1`,
  )
    .bind(prefix, hash)
    .first<ApiKeyRow>()

  if (!key) {
    return c.json({ error: 'invalid_api_key' }, 401)
  }

  const product = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ? AND active = 1 LIMIT 1`)
    .bind(key.product_id)
    .first<ProductRow>()

  if (!product) {
    return c.json({ error: 'product_inactive' }, 403)
  }

  c.executionCtx.waitUntil(
    c.env.DB.prepare(`UPDATE api_keys SET last_used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
      .bind(key.id)
      .run(),
  )

  c.set('auth', { product, key })
  await next()
}

export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Next) {
  const expected = c.env.WEBHOOKS_ADMIN_TOKEN
  if (!expected) {
    return c.json({ error: 'admin_not_configured' }, 503)
  }
  const provided =
    c.req.header('X-Admin-Token') ||
    parseBearer(c.req.header('Authorization')) ||
    ''
  if (!timingSafeEqual(provided, expected)) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  await next()
}
