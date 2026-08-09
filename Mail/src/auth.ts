import type { Context, Next } from 'hono'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { parseBearer, sha256Hex, timingSafeEqual } from './crypto'
import type { ApiKeyRow, AuthContext, Env, ProductRow } from './types'

type AppVars = { auth: AuthContext }

export async function requireProductKey(c: Context<{ Bindings: Env; Variables: AppVars }>, next: Next) {
  const token = parseBearer(c.req.header('Authorization'))
  if (!token || !token.startsWith('pm_')) {
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

/**
 * Admin auth: X-Admin-Token (ops) OR pisigma-auth Bearer JWT (internal Auth/, not Clerk).
 * JWT requires MAIL_AUTH_JWKS_URL; audience defaults to "mail".
 */
export async function requireAdmin(c: Context<{ Bindings: Env }>, next: Next) {
  const adminToken = c.env.MAIL_ADMIN_TOKEN
  const headerToken = c.req.header('X-Admin-Token') || ''
  if (adminToken && headerToken && timingSafeEqual(headerToken, adminToken)) {
    await next()
    return
  }

  const bearer = parseBearer(c.req.header('Authorization'))
  if (bearer && c.env.MAIL_AUTH_JWKS_URL) {
    try {
      const jwks = createRemoteJWKSet(new URL(c.env.MAIL_AUTH_JWKS_URL))
      const audience = c.env.MAIL_AUTH_AUDIENCE || 'mail'
      const { payload } = await jwtVerify(bearer, jwks, {
        issuer: c.env.MAIL_AUTH_ISSUER || undefined,
        audience,
      })
      if (payload.sub) {
        await next()
        return
      }
    } catch {
      return c.json({ error: 'unauthorized', detail: 'invalid_auth_jwt' }, 401)
    }
  }

  // Allow Bearer admin token as legacy/ops convenience when it matches
  if (adminToken && bearer && timingSafeEqual(bearer, adminToken)) {
    await next()
    return
  }

  if (!adminToken && !c.env.MAIL_AUTH_JWKS_URL) {
    return c.json({ error: 'admin_not_configured' }, 503)
  }
  return c.json({ error: 'unauthorized' }, 401)
}
