import { Hono } from 'hono'
import { requireProductKey } from '../auth'
import { newId } from '../crypto'
import { assertWithinRateLimit } from '../policy'
import { createRazorpayOrder, razorpayConfigured, verifyPaymentSignature } from '../razorpay'
import type {
  AuthContext,
  CreateOrderRequest,
  Env,
  PaymentRow,
  PlanRow,
  VerifyRequest,
} from '../types'

type App = { Bindings: Env; Variables: { auth: AuthContext } }

export const billingRoutes = new Hono<App>()

billingRoutes.use('*', requireProductKey)

function paymentResponse(row: PaymentRow) {
  return {
    id: row.id,
    status: row.status,
    plan: row.plan_slug,
    plan_id: row.plan_id,
    amount_paise: row.amount_paise,
    currency: row.currency,
    razorpay_order_id: row.razorpay_order_id,
    razorpay_payment_id: row.razorpay_payment_id,
    receipt: row.receipt,
    notes: row.notes ? JSON.parse(row.notes) : {},
    metadata: row.metadata ? JSON.parse(row.metadata) : {},
    idempotency_key: row.idempotency_key,
    confirmed_at: row.confirmed_at,
    created_at: row.created_at,
  }
}

billingRoutes.get('/plans', async (c) => {
  const auth = c.get('auth')
  const { results } = await c.env.DB.prepare(
    `SELECT id, slug, name, amount_paise, currency, interval
     FROM plans WHERE product_id = ? AND active = 1 ORDER BY amount_paise`,
  )
    .bind(auth.product.id)
    .all<PlanRow>()

  return c.json({ plans: results || [] })
})

billingRoutes.post('/orders', async (c) => {
  const auth = c.get('auth')
  const body = await c.req.json<CreateOrderRequest>().catch(() => null)
  if (!body) return c.json({ error: 'invalid_json' }, 400)

  const idempotencyKey = c.req.header('Idempotency-Key')?.trim() || null
  if (idempotencyKey) {
    if (idempotencyKey.length > 128) {
      return c.json({ error: 'idempotency_key_too_long' }, 400)
    }
    const existing = await c.env.DB.prepare(
      `SELECT * FROM payments WHERE product_id = ? AND idempotency_key = ? LIMIT 1`,
    )
      .bind(auth.product.id, idempotencyKey)
      .first<PaymentRow>()
    if (existing) {
      return c.json(orderCreateResponse(c.env, existing, auth.product.name), 200)
    }
  }

  const rate = await assertWithinRateLimit(c.env.DB, auth.product)
  if (!rate.ok) {
    return c.json(
      { error: 'rate_limited', limit: rate.limit, used: rate.used, window: 'hour' },
      429,
    )
  }

  let plan: PlanRow | null = null
  let amountPaise = 0
  let currency = 'INR'
  let planSlug: string | null = null
  let planId: string | null = null

  if (body.plan) {
    planSlug = body.plan.trim().toLowerCase()
    plan = await c.env.DB.prepare(
      `SELECT * FROM plans WHERE product_id = ? AND slug = ? AND active = 1 LIMIT 1`,
    )
      .bind(auth.product.id, planSlug)
      .first<PlanRow>()
    if (!plan) return c.json({ error: 'plan_not_found' }, 404)
    amountPaise = plan.amount_paise
    currency = plan.currency
    planId = plan.id
  } else if (body.amount_paise != null) {
    amountPaise = Number(body.amount_paise)
    if (!Number.isInteger(amountPaise) || amountPaise < 100) {
      return c.json({ error: 'invalid_amount_paise', detail: 'Minimum 100 paise (₹1)' }, 400)
    }
    currency = (body.currency || 'INR').toUpperCase()
    if (currency !== 'INR') {
      return c.json({ error: 'unsupported_currency' }, 400)
    }
  } else {
    return c.json({ error: 'plan_or_amount_required' }, 400)
  }

  const paymentId = newId('pay')
  const receipt =
    (body.receipt || '').trim().slice(0, 40) ||
    `pb_${auth.product.slug.slice(0, 8)}_${paymentId.slice(-10)}`
  const notes: Record<string, string> = {
    product: auth.product.slug,
    payment_id: paymentId,
    ...(body.notes || {}),
  }
  if (planSlug) notes.plan = planSlug
  const metadata = body.metadata || {}

  const hasRazorpay = razorpayConfigured(c.env)
  const allowDev = c.env.ALLOW_DEV_CHARGE === '1'

  let razorpayOrderId: string | null = null
  let status = 'created'
  let confirmedAt: string | null = null
  let mode: 'razorpay' | 'dev' = 'razorpay'
  let keyId: string | null = c.env.RAZORPAY_KEY_ID || null

  if (hasRazorpay) {
    const created = await createRazorpayOrder({
      keyId: c.env.RAZORPAY_KEY_ID!,
      keySecret: c.env.RAZORPAY_KEY_SECRET!,
      amountPaise,
      currency,
      receipt,
      notes,
    })
    if (!created.ok) {
      return c.json({ error: 'order_failed', detail: created.error }, 502)
    }
    razorpayOrderId = String(created.order.id)
  } else if (allowDev) {
    mode = 'dev'
    razorpayOrderId = `order_dev_${paymentId.slice(-16)}`
    status = 'paid'
    confirmedAt = new Date().toISOString()
    keyId = 'rzp_test_dev'
  } else {
    return c.json(
      {
        error: 'razorpay_not_configured',
        hint: 'Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET, or ALLOW_DEV_CHARGE=1 for local fake orders',
      },
      503,
    )
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO payments (
        id, product_id, api_key_id, plan_id, plan_slug, amount_paise, currency, status,
        razorpay_order_id, receipt, notes, metadata, idempotency_key, confirmed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        paymentId,
        auth.product.id,
        auth.key.id,
        planId,
        planSlug,
        amountPaise,
        currency,
        status,
        razorpayOrderId,
        receipt,
        JSON.stringify(notes),
        JSON.stringify(metadata),
        idempotencyKey,
        confirmedAt,
      )
      .run()
  } catch (e) {
    if (idempotencyKey) {
      const existing = await c.env.DB.prepare(
        `SELECT * FROM payments WHERE product_id = ? AND idempotency_key = ? LIMIT 1`,
      )
        .bind(auth.product.id, idempotencyKey)
        .first<PaymentRow>()
      if (existing) {
        return c.json(orderCreateResponse(c.env, existing, auth.product.name), 200)
      }
    }
    throw e
  }

  const row = await c.env.DB.prepare(`SELECT * FROM payments WHERE id = ?`)
    .bind(paymentId)
    .first<PaymentRow>()

  return c.json(
    {
      ...orderCreateResponse(c.env, row!, auth.product.name, body.description || plan?.name),
      mode,
      key_id: keyId,
    },
    201,
  )
})

function orderCreateResponse(
  env: Env,
  row: PaymentRow,
  productName: string,
  description?: string,
) {
  return {
    id: row.id,
    status: row.status,
    order_id: row.razorpay_order_id,
    key_id: env.RAZORPAY_KEY_ID || (row.status === 'paid' ? 'rzp_test_dev' : null),
    amount: row.amount_paise,
    currency: row.currency,
    plan: row.plan_slug,
    name: productName,
    description: description || undefined,
    payment: paymentResponse(row),
  }
}

billingRoutes.post('/verify', async (c) => {
  const auth = c.get('auth')
  const body = await c.req.json<VerifyRequest>().catch(() => null)
  if (!body) return c.json({ error: 'invalid_json' }, 400)

  const orderId = body.razorpay_order_id?.trim()
  const paymentId = body.razorpay_payment_id?.trim()
  const signature = body.razorpay_signature?.trim()
  if (!orderId || !paymentId || !signature) {
    return c.json({ error: 'missing_razorpay_fields' }, 400)
  }

  const row = await c.env.DB.prepare(
    `SELECT * FROM payments WHERE razorpay_order_id = ? AND product_id = ? LIMIT 1`,
  )
    .bind(orderId, auth.product.id)
    .first<PaymentRow>()

  if (!row) return c.json({ error: 'order_not_found' }, 404)

  if (row.status === 'paid') {
    return c.json({ ok: true, payment: paymentResponse(row) })
  }

  // Dev orders: accept signature "dev" when ALLOW_DEV_CHARGE and order is order_dev_*
  if (
    c.env.ALLOW_DEV_CHARGE === '1' &&
    orderId.startsWith('order_dev_') &&
    (!razorpayConfigured(c.env) || signature === 'dev')
  ) {
    await c.env.DB.prepare(
      `UPDATE payments SET razorpay_payment_id = ?, status = 'paid',
       confirmed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
    )
      .bind(paymentId, row.id)
      .run()
    const updated = await c.env.DB.prepare(`SELECT * FROM payments WHERE id = ?`)
      .bind(row.id)
      .first<PaymentRow>()
    return c.json({ ok: true, payment: paymentResponse(updated!), mode: 'dev' })
  }

  const keySecret = c.env.RAZORPAY_KEY_SECRET
  if (!keySecret) return c.json({ error: 'razorpay_not_configured' }, 503)

  const ok = await verifyPaymentSignature(keySecret, orderId, paymentId, signature)
  if (!ok) return c.json({ error: 'invalid_signature' }, 400)

  await c.env.DB.prepare(
    `UPDATE payments SET razorpay_payment_id = ?, status = 'paid',
     confirmed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
  )
    .bind(paymentId, row.id)
    .run()

  const updated = await c.env.DB.prepare(`SELECT * FROM payments WHERE id = ?`)
    .bind(row.id)
    .first<PaymentRow>()

  return c.json({ ok: true, payment: paymentResponse(updated!) })
})

billingRoutes.get('/payments/:id', async (c) => {
  const auth = c.get('auth')
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(
    `SELECT * FROM payments WHERE id = ? AND product_id = ? LIMIT 1`,
  )
    .bind(id, auth.product.id)
    .first<PaymentRow>()
  if (!row) return c.json({ error: 'not_found' }, 404)
  return c.json(paymentResponse(row))
})

billingRoutes.get('/payments', async (c) => {
  const auth = c.get('auth')
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 25)))
  const { results } = await c.env.DB.prepare(
    `SELECT * FROM payments WHERE product_id = ? ORDER BY created_at DESC LIMIT ?`,
  )
    .bind(auth.product.id, limit)
    .all<PaymentRow>()

  return c.json({ payments: (results || []).map(paymentResponse) })
})
