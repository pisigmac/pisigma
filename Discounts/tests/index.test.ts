import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaDiscounts } from '../src/client'

describe('Discounts Service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-discounts')
    expect(json.environment).toBe('development')
  })

  it('POST /v1/discounts/evaluate applies valid percentage discount', async () => {
    const res = await app.request('/v1/discounts/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SAVE10', cart_total: 100 }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.valid).toBe(true)
    expect(json.code).toBe('SAVE10')
    expect(json.discount_amount).toBe(10)
    expect(json.final_total).toBe(90)
  })

  it('POST /v1/discounts/evaluate rejects coupon below min cart amount', async () => {
    const res = await app.request('/v1/discounts/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'SAVE10', cart_total: 10 }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.valid).toBe(false)
    expect(json.discount_amount).toBe(0)
    expect(json.final_total).toBe(10)
  })

  it('POST /v1/discounts/evaluate rejects invalid coupon code', async () => {
    const res = await app.request('/v1/discounts/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'INVALIDCODE', cart_total: 100 }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.valid).toBe(false)
    expect(json.discount_amount).toBe(0)
  })

  it('POST /v1/discounts/coupons creates a new coupon and evaluates it', async () => {
    const createRes = await app.request('/v1/discounts/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'FLASH30',
        discount_type: 'percentage',
        discount_value: 30,
      }),
    })
    expect(createRes.status).toBe(201)
    const createJson = (await createRes.json()) as any
    expect(createJson.success).toBe(true)
    expect(createJson.coupon.code).toBe('FLASH30')

    const evalRes = await app.request('/v1/discounts/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'FLASH30', cart_total: 200 }),
    })
    expect(evalRes.status).toBe(200)
    const evalJson = (await evalRes.json()) as any
    expect(evalJson.valid).toBe(true)
    expect(evalJson.discount_amount).toBe(60)
    expect(evalJson.final_total).toBe(140)
  })

  it('PisigmaDiscounts client operates correctly', async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const url = new URL(urlStr)
      const req = new Request(url, init)
      return app.request(req)
    }

    const client = new PisigmaDiscounts({ baseUrl: 'http://localhost:8800', fetch: fetchMock as any })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)
    if (health.ok) {
      expect(health.data.service).toBe('pisigma-discounts')
    }

    const evalRes = await client.evaluateDiscount({ code: 'SAVE10', cart_total: 50 })
    expect(evalRes.ok).toBe(true)
    if (evalRes.ok) {
      expect(evalRes.data.valid).toBe(true)
      expect(evalRes.data.discount_amount).toBe(5)
      expect(evalRes.data.final_total).toBe(45)
    }

    const couponRes = await client.createCoupon({
      code: 'VIP50',
      discount_type: 'fixed',
      discount_value: 50,
      min_cart_amount: 100,
    })
    expect(couponRes.ok).toBe(true)
    if (couponRes.ok) {
      expect(couponRes.data.coupon.code).toBe('VIP50')
    }
  })
})
