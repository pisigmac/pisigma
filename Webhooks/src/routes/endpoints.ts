import { Hono } from 'hono'
import { requireProductKey } from '../auth'
import { newId } from '../crypto'
import { isHttpUrl, parseEventTypes } from '../policy'
import type { AuthContext, CreateEndpointRequest, EndpointRow, Env } from '../types'

type App = { Bindings: Env; Variables: { auth: AuthContext } }

export const endpointRoutes = new Hono<App>()

endpointRoutes.use('*', requireProductKey)

function endpointResponse(row: EndpointRow) {
  return {
    id: row.id,
    url: row.url,
    event_types: parseEventTypes(row.event_types),
    description: row.description,
    active: !!row.active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

endpointRoutes.post('/endpoints', async (c) => {
  const auth = c.get('auth')
  const body = await c.req.json<CreateEndpointRequest>().catch(() => null)
  if (!body) return c.json({ error: 'invalid_json' }, 400)

  const url = (body.url || '').trim()
  if (!isHttpUrl(url)) return c.json({ error: 'invalid_url' }, 400)

  const secret = (body.secret || '').trim()
  if (secret.length < 8 || secret.length > 256) {
    return c.json({ error: 'invalid_secret', detail: 'secret must be 8–256 characters' }, 400)
  }

  let eventTypesJson: string | null = null
  if (body.event_types != null) {
    if (!Array.isArray(body.event_types)) {
      return c.json({ error: 'invalid_event_types' }, 400)
    }
    const cleaned = body.event_types.map((t) => String(t).trim()).filter(Boolean)
    eventTypesJson = cleaned.length ? JSON.stringify(cleaned) : null
  }

  const description = body.description?.trim() || null
  const id = newId('ep')

  await c.env.DB.prepare(
    `INSERT INTO endpoints (id, product_id, url, secret, event_types, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, auth.product.id, url, secret, eventTypesJson, description)
    .run()

  const row = await c.env.DB.prepare(`SELECT * FROM endpoints WHERE id = ?`)
    .bind(id)
    .first<EndpointRow>()

  return c.json(endpointResponse(row!), 201)
})

endpointRoutes.get('/endpoints', async (c) => {
  const auth = c.get('auth')
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM endpoints WHERE product_id = ? ORDER BY created_at DESC`,
  )
    .bind(auth.product.id)
    .all<EndpointRow>()

  return c.json({ endpoints: (results || []).map(endpointResponse) })
})

endpointRoutes.get('/endpoints/:id', async (c) => {
  const auth = c.get('auth')
  const row = await c.env.DB.prepare(
    `SELECT * FROM endpoints WHERE id = ? AND product_id = ? LIMIT 1`,
  )
    .bind(c.req.param('id'), auth.product.id)
    .first<EndpointRow>()
  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json(endpointResponse(row))
})

endpointRoutes.patch('/endpoints/:id', async (c) => {
  const auth = c.get('auth')
  const row = await c.env.DB.prepare(
    `SELECT * FROM endpoints WHERE id = ? AND product_id = ? LIMIT 1`,
  )
    .bind(c.req.param('id'), auth.product.id)
    .first<EndpointRow>()
  if (!row) return c.json({ error: 'not_found' }, 404)

  const body = await c.req.json<{
    url?: string
    secret?: string
    event_types?: string[] | null
    description?: string | null
    active?: boolean
  }>().catch(() => null)
  if (!body) return c.json({ error: 'invalid_json' }, 400)

  const url = body.url != null ? body.url.trim() : row.url
  if (!isHttpUrl(url)) return c.json({ error: 'invalid_url' }, 400)

  let secret = row.secret
  if (body.secret != null) {
    secret = body.secret.trim()
    if (secret.length < 8 || secret.length > 256) {
      return c.json({ error: 'invalid_secret' }, 400)
    }
  }

  let eventTypesJson = row.event_types
  if (body.event_types !== undefined) {
    if (body.event_types == null) {
      eventTypesJson = null
    } else if (!Array.isArray(body.event_types)) {
      return c.json({ error: 'invalid_event_types' }, 400)
    } else {
      const cleaned = body.event_types.map((t) => String(t).trim()).filter(Boolean)
      eventTypesJson = cleaned.length ? JSON.stringify(cleaned) : null
    }
  }

  const description =
    body.description === undefined ? row.description : body.description?.trim() || null
  const active = body.active == null ? row.active : body.active ? 1 : 0

  await c.env.DB.prepare(
    `UPDATE endpoints SET
       url = ?, secret = ?, event_types = ?, description = ?, active = ?,
       updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE id = ?`,
  )
    .bind(url, secret, eventTypesJson, description, active, row.id)
    .run()

  const updated = await c.env.DB.prepare(`SELECT * FROM endpoints WHERE id = ?`)
    .bind(row.id)
    .first<EndpointRow>()

  return c.json(endpointResponse(updated!))
})
