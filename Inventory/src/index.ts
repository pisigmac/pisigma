import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, InventorySKU, ReservationRequest, ReservationResult } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

interface InternalSKU {
  sku_id: string
  name: string
  quantity: number
  reserved_quantity: number
  location?: string
  updated_at: string
}

const skuStore: Map<string, InternalSKU> = new Map([
  [
    'SKU-1001',
    {
      sku_id: 'SKU-1001',
      name: 'Wireless Ergonomic Mouse',
      quantity: 150,
      reserved_quantity: 10,
      location: 'Warehouse-A1',
      updated_at: new Date().toISOString(),
    },
  ],
  [
    'SKU-1002',
    {
      sku_id: 'SKU-1002',
      name: 'Mechanical Gaming Keyboard',
      quantity: 75,
      reserved_quantity: 5,
      location: 'Warehouse-B2',
      updated_at: new Date().toISOString(),
    },
  ],
  [
    'SKU-1003',
    {
      sku_id: 'SKU-1003',
      name: '4K Ultra HD Monitor 27"',
      quantity: 20,
      reserved_quantity: 0,
      location: 'Warehouse-A2',
      updated_at: new Date().toISOString(),
    },
  ],
])

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-inventory',
    environment: c.env?.INVENTORY_ENV || 'development',
  })
})

app.get('/v1/inventory/skus/:id', (c) => {
  const id = c.req.param('id')
  const item = skuStore.get(id)

  if (!item) {
    return c.json({ error: `SKU '${id}' not found` }, 404)
  }

  const sku: InventorySKU = {
    sku_id: item.sku_id,
    name: item.name,
    quantity: item.quantity,
    reserved_quantity: item.reserved_quantity,
    available_quantity: Math.max(0, item.quantity - item.reserved_quantity),
    location: item.location,
    updated_at: item.updated_at,
  }

  return c.json(sku)
})

app.post('/v1/inventory/reserve', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<ReservationRequest>

  if (!body.sku_id || typeof body.quantity !== 'number' || body.quantity <= 0) {
    return c.json({ error: 'Missing or invalid sku_id or quantity' }, 400)
  }

  const item = skuStore.get(body.sku_id)
  if (!item) {
    return c.json({ error: `SKU '${body.sku_id}' not found` }, 404)
  }

  const available = item.quantity - item.reserved_quantity
  if (available < body.quantity) {
    const failureResult: ReservationResult = {
      reservation_id: body.reservation_id || `res_fail_${Date.now()}`,
      sku_id: item.sku_id,
      quantity: body.quantity,
      status: 'insufficient_stock',
      remaining_stock: available,
      error: 'Insufficient stock available',
    }
    return c.json(failureResult, 400)
  }

  item.reserved_quantity += body.quantity
  item.updated_at = new Date().toISOString()

  const reservationId = body.reservation_id || `res_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`
  const remainingStock = item.quantity - item.reserved_quantity

  const successResult: ReservationResult = {
    reservation_id: reservationId,
    sku_id: item.sku_id,
    quantity: body.quantity,
    status: 'reserved',
    remaining_stock: remainingStock,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  }

  return c.json(successResult, 200)
})

export default app
