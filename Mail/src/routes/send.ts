import { Hono } from 'hono'
import { requireProductKey } from '../auth'
import { newId } from '../crypto'
import { assertWithinRateLimit, pickFromAddress } from '../policy'
import { deliverMail } from '../providers'
import { renderTemplate } from '../templates'
import type { AuthContext, Env, MessageRow, SendRequest, TemplateRow } from '../types'

type App = { Bindings: Env; Variables: { auth: AuthContext } }

export const sendRoutes = new Hono<App>()

sendRoutes.use('*', requireProductKey)

function normalizeTo(to: string | string[] | undefined): string[] {
  if (!to) return []
  const list = Array.isArray(to) ? to : [to]
  return [...new Set(list.map((t) => t.trim().toLowerCase()).filter(Boolean))]
}

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

sendRoutes.post('/send', async (c) => {
  const auth = c.get('auth')
  const body = await c.req.json<SendRequest>().catch(() => null)
  if (!body) return c.json({ error: 'invalid_json' }, 400)

  const to = normalizeTo(body.to)
  if (!to.length || to.length > 50) {
    return c.json({ error: 'to_required', detail: 'Provide 1–50 recipients' }, 400)
  }
  if (to.some((addr) => !isEmail(addr))) {
    return c.json({ error: 'invalid_recipient' }, 400)
  }

  const idempotencyKey = c.req.header('Idempotency-Key')?.trim() || null
  if (idempotencyKey) {
    if (idempotencyKey.length > 128) {
      return c.json({ error: 'idempotency_key_too_long' }, 400)
    }
    const existing = await c.env.DB.prepare(
      `SELECT * FROM messages WHERE product_id = ? AND idempotency_key = ? LIMIT 1`,
    )
      .bind(auth.product.id, idempotencyKey)
      .first<MessageRow>()
    if (existing) {
      return c.json(messageResponse(existing), existing.status === 'failed' ? 502 : 200)
    }
  }

  const rate = await assertWithinRateLimit(c.env.DB, auth.product)
  if (!rate.ok) {
    return c.json(
      { error: 'rate_limited', limit: rate.limit, used: rate.used, window: 'hour' },
      429,
    )
  }

  const defaultFrom = c.env.MAIL_FROM || 'PlexApps <noreply@plexapps.com>'
  const fromPick = pickFromAddress(auth.product, body.from, defaultFrom)
  if (!fromPick.ok) return c.json({ error: 'from_not_allowed', detail: fromPick.error }, 403)

  let subject = body.subject?.trim() || ''
  let html = body.html
  let text = body.text
  let templateId: string | null = null

  if (body.template) {
    templateId = body.template.trim()
    const tpl = await c.env.DB.prepare(
      `SELECT * FROM templates WHERE product_id = ? AND id = ? LIMIT 1`,
    )
      .bind(auth.product.id, templateId)
      .first<TemplateRow>()
    if (!tpl) return c.json({ error: 'template_not_found' }, 404)
    const data = body.data || {}
    subject = renderTemplate(tpl.subject, data)
    html = tpl.html != null ? renderTemplate(tpl.html, data) : undefined
    text = tpl.text != null ? renderTemplate(tpl.text, data) : undefined
  }

  if (!subject) return c.json({ error: 'subject_required' }, 400)
  if (!html && !text) return c.json({ error: 'html_or_text_required' }, 400)

  const messageId = newId('msg')
  const tags = body.tags || []
  const metadata = body.metadata || {}

  const result = await deliverMail(c.env, {
    from: fromPick.from,
    to,
    subject,
    html,
    text,
    replyTo: body.reply_to,
    tags,
  })

  const status = result.ok ? 'sent' : 'failed'
  const providerId = result.ok ? result.providerId : null
  const error = result.ok ? null : result.error

  try {
    await c.env.DB.prepare(
      `INSERT INTO messages (
        id, product_id, api_key_id, to_addrs, from_addr, reply_to, subject, template_id,
        provider, provider_id, status, error, tags, metadata, idempotency_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        messageId,
        auth.product.id,
        auth.key.id,
        JSON.stringify(to),
        fromPick.from,
        body.reply_to || null,
        subject,
        templateId,
        result.provider,
        providerId,
        status,
        error,
        JSON.stringify(tags),
        JSON.stringify(metadata),
        idempotencyKey,
      )
      .run()
  } catch (e) {
    // Race on idempotency unique index
    if (idempotencyKey) {
      const existing = await c.env.DB.prepare(
        `SELECT * FROM messages WHERE product_id = ? AND idempotency_key = ? LIMIT 1`,
      )
        .bind(auth.product.id, idempotencyKey)
        .first<MessageRow>()
      if (existing) return c.json(messageResponse(existing), 200)
    }
    throw e
  }

  if (!result.ok) {
    return c.json(
      {
        id: messageId,
        status: 'failed',
        error,
        provider: result.provider,
      },
      502,
    )
  }

  return c.json(
    {
      id: messageId,
      status: 'sent',
      provider: result.provider,
      provider_id: providerId,
    },
    202,
  )
})

sendRoutes.get('/messages/:id', async (c) => {
  const auth = c.get('auth')
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(
    `SELECT * FROM messages WHERE id = ? AND product_id = ? LIMIT 1`,
  )
    .bind(id, auth.product.id)
    .first<MessageRow>()
  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json(messageResponse(row))
})

function messageResponse(row: MessageRow) {
  return {
    id: row.id,
    status: row.status,
    to: JSON.parse(row.to_addrs || '[]'),
    from: row.from_addr,
    reply_to: row.reply_to,
    subject: row.subject,
    template: row.template_id,
    provider: row.provider,
    provider_id: row.provider_id,
    error: row.error,
    tags: row.tags ? JSON.parse(row.tags) : [],
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    idempotency_key: row.idempotency_key,
    created_at: row.created_at,
  }
}
