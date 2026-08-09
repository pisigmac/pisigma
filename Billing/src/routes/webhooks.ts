import { Hono } from 'hono'
import { verifyWebhookSignature } from '../razorpay'
import type { Env, PaymentRow } from '../types'

type App = { Bindings: Env }

export const webhookRoutes = new Hono<App>()

/**
 * Razorpay webhook receiver.
 * Verifies X-Razorpay-Signature when RAZORPAY_WEBHOOK_SECRET is set.
 * Marks matching payments paid on payment.captured / order.paid.
 */
webhookRoutes.post('/razorpay', async (c) => {
  const rawBody = await c.req.text()
  const secret = c.env.RAZORPAY_WEBHOOK_SECRET

  if (secret) {
    const signature = c.req.header('X-Razorpay-Signature') || ''
    const ok = await verifyWebhookSignature(secret, rawBody, signature)
    if (!ok) return c.json({ error: 'invalid_webhook_signature' }, 400)
  }

  let payload: {
    event?: string
    payload?: {
      payment?: { entity?: Record<string, unknown> }
      order?: { entity?: Record<string, unknown> }
    }
  }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return c.json({ error: 'invalid_json' }, 400)
  }

  const event = payload.event || ''
  const paymentEntity = payload.payload?.payment?.entity
  const orderEntity = payload.payload?.order?.entity

  let orderId: string | null = null
  let razorpayPaymentId: string | null = null

  if (paymentEntity) {
    orderId = paymentEntity.order_id ? String(paymentEntity.order_id) : null
    razorpayPaymentId = paymentEntity.id ? String(paymentEntity.id) : null
  }
  if (!orderId && orderEntity?.id) {
    orderId = String(orderEntity.id)
  }

  const paidEvents = new Set([
    'payment.captured',
    'payment.authorized',
    'order.paid',
  ])

  if (!orderId || !paidEvents.has(event)) {
    return c.json({ ok: true, ignored: true, event })
  }

  const row = await c.env.DB.prepare(
    `SELECT * FROM payments WHERE razorpay_order_id = ? LIMIT 1`,
  )
    .bind(orderId)
    .first<PaymentRow>()

  if (!row) {
    return c.json({ ok: true, matched: false, event })
  }

  if (row.status !== 'paid') {
    await c.env.DB.prepare(
      `UPDATE payments SET
         razorpay_payment_id = COALESCE(?, razorpay_payment_id),
         status = 'paid',
         confirmed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
    )
      .bind(razorpayPaymentId, row.id)
      .run()
  }

  return c.json({ ok: true, matched: true, payment_id: row.id, event })
})
