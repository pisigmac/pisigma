import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaInventory } from '../src/client'

describe('Inventory Service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-inventory')
    expect(json.environment).toBe('development')
  })

  it('GET /v1/inventory/skus/:id returns SKU details', async () => {
    const res = await app.request('/v1/inventory/skus/SKU-1001')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.sku_id).toBe('SKU-1001')
    expect(json.name).toBe('Wireless Ergonomic Mouse')
    expect(json.quantity).toBe(150)
    expect(json.available_quantity).toBe(140)
  })

  it('GET /v1/inventory/skus/:id returns 404 for unknown SKU', async () => {
    const res = await app.request('/v1/inventory/skus/NONEXISTENT')
    expect(res.status).toBe(404)
    const json = (await res.json()) as any
    expect(json.error).toContain('not found')
  })

  it('POST /v1/inventory/reserve reserves stock successfully', async () => {
    const res = await app.request('/v1/inventory/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku_id: 'SKU-1002', quantity: 10 }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('reserved')
    expect(json.sku_id).toBe('SKU-1002')
    expect(json.quantity).toBe(10)
    expect(json.remaining_stock).toBe(60)
  })

  it('POST /v1/inventory/reserve fails when stock is insufficient', async () => {
    const res = await app.request('/v1/inventory/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku_id: 'SKU-1003', quantity: 500 }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.status).toBe('insufficient_stock')
    expect(json.error).toContain('Insufficient stock')
  })

  it('PisigmaInventory client operates correctly', async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const url = new URL(urlStr)
      const req = new Request(url, init)
      return app.request(req)
    }

    const client = new PisigmaInventory({ baseUrl: 'http://localhost:8801', fetch: fetchMock as any })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)
    if (health.ok) {
      expect(health.data.service).toBe('pisigma-inventory')
    }

    const skuRes = await client.getSKU('SKU-1001')
    expect(skuRes.ok).toBe(true)
    if (skuRes.ok) {
      expect(skuRes.data.sku_id).toBe('SKU-1001')
    }

    const reserveRes = await client.reserveInventory({ sku_id: 'SKU-1001', quantity: 5 })
    expect(reserveRes.ok).toBe(true)
    if (reserveRes.ok) {
      expect(reserveRes.data.status).toBe('reserved')
      expect(reserveRes.data.quantity).toBe(5)
    }
  })
})
