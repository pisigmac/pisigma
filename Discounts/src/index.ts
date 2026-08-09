import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, Coupon, CreateCouponRequest, DiscountEvaluationRequest, DiscountEvaluationResult } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const couponsStore: Map<string, Coupon> = new Map([
  [
    'SAVE10',
    {
      code: 'SAVE10',
      discount_type: 'percentage',
      discount_value: 10,
      min_cart_amount: 20,
      active: true,
      created_at: new Date().toISOString(),
    },
  ],
  [
    'WELCOME50',
    {
      code: 'WELCOME50',
      discount_type: 'fixed',
      discount_value: 50,
      min_cart_amount: 100,
      active: true,
      created_at: new Date().toISOString(),
    },
  ],
  [
    'SUMMER20',
    {
      code: 'SUMMER20',
      discount_type: 'percentage',
      discount_value: 20,
      max_discount_amount: 50,
      active: true,
      created_at: new Date().toISOString(),
    },
  ],
])

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-discounts',
    environment: c.env?.DISCOUNTS_ENV || 'development',
  })
})

app.post('/v1/discounts/evaluate', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<DiscountEvaluationRequest>

  if (typeof body.cart_total !== 'number' || body.cart_total < 0) {
    return c.json({ error: 'Invalid or missing cart_total' }, 400)
  }

  const cartTotal = body.cart_total
  const rawCode = body.code?.trim().toUpperCase()

  if (!rawCode) {
    const result: DiscountEvaluationResult = {
      valid: true,
      discount_amount: 0,
      final_total: cartTotal,
      message: 'No coupon code applied',
    }
    return c.json(result)
  }

  const coupon = couponsStore.get(rawCode)
  if (!coupon || !coupon.active) {
    const result: DiscountEvaluationResult = {
      code: rawCode,
      valid: false,
      discount_amount: 0,
      final_total: cartTotal,
      message: 'Invalid or inactive coupon code',
    }
    return c.json(result)
  }

  if (coupon.min_cart_amount && cartTotal < coupon.min_cart_amount) {
    const result: DiscountEvaluationResult = {
      code: rawCode,
      valid: false,
      discount_amount: 0,
      final_total: cartTotal,
      message: `Cart total must be at least $${coupon.min_cart_amount} for code ${rawCode}`,
    }
    return c.json(result)
  }

  let discountAmount = 0
  if (coupon.discount_type === 'percentage') {
    discountAmount = (cartTotal * coupon.discount_value) / 100
    if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
      discountAmount = coupon.max_discount_amount
    }
  } else if (coupon.discount_type === 'fixed') {
    discountAmount = Math.min(cartTotal, coupon.discount_value)
  }

  discountAmount = Math.round(discountAmount * 100) / 100
  const finalTotal = Math.max(0, Math.round((cartTotal - discountAmount) * 100) / 100)

  const result: DiscountEvaluationResult = {
    code: coupon.code,
    valid: true,
    discount_amount: discountAmount,
    final_total: finalTotal,
    discount_type: coupon.discount_type,
    message: 'Coupon evaluated successfully',
  }

  return c.json(result)
})

app.post('/v1/discounts/coupons', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<CreateCouponRequest>

  if (!body.code || !body.discount_type || typeof body.discount_value !== 'number') {
    return c.json({ error: 'Missing required fields: code, discount_type, discount_value' }, 400)
  }

  if (body.discount_type !== 'percentage' && body.discount_type !== 'fixed') {
    return c.json({ error: 'discount_type must be percentage or fixed' }, 400)
  }

  if (body.discount_value <= 0) {
    return c.json({ error: 'discount_value must be greater than 0' }, 400)
  }

  const code = body.code.trim().toUpperCase()
  const coupon: Coupon = {
    code,
    discount_type: body.discount_type,
    discount_value: body.discount_value,
    min_cart_amount: body.min_cart_amount,
    max_discount_amount: body.max_discount_amount,
    active: true,
    created_at: new Date().toISOString(),
    expires_at: body.expires_at,
  }

  couponsStore.set(code, coupon)

  return c.json({ success: true, coupon }, 201)
})

app.get('/v1/discounts/coupons', (c) => {
  const coupons = Array.from(couponsStore.values())
  return c.json({ coupons })
})

export default app
