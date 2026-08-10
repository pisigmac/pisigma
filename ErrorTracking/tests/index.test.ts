import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaErrorTracking } from '../src/client'

describe('ErrorTracking Service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-error-tracking')
    expect(json.environment).toBe('development')
  })

  it('POST /v1/errors/capture requires service and message', async () => {
    const res = await app.request('/v1/errors/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'billing' }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.error).toBe('Error message is required')
  })

  it('POST /v1/errors/capture captures an error event', async () => {
    const res = await app.request('/v1/errors/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'Auth',
        message: 'Database connection failure',
        level: 'fatal',
        stack: 'Error: Database connection failure\n at connectDB (db.ts:12)',
      }),
    })
    expect(res.status).toBe(201)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.event.service).toBe('Auth')
    expect(json.event.level).toBe('fatal')
    expect(json.event.id).toBeDefined()
  })

  it('GET /v1/errors/summary aggregates error metrics', async () => {
    await app.request('/v1/errors/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: 'Billing',
        message: 'Stripe webhook signature invalid',
        level: 'error',
      }),
    })

    const res = await app.request('/v1/errors/summary')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.total_errors).toBeGreaterThan(0)
    expect(json.errors_by_service['Billing']).toBe(1)
    expect(json.recent_errors.length).toBeGreaterThan(0)
  })

  it('PisigmaErrorTracking client operates correctly', async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const url = new URL(urlStr)
      const req = new Request(url, init)
      return app.request(req)
    }

    const client = new PisigmaErrorTracking({ baseUrl: 'http://localhost:8805', fetch: fetchMock as any })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)
    if (health.ok) {
      expect(health.data.service).toBe('pisigma-error-tracking')
    }

    const captureRes = await client.captureError({
      service: 'Mail',
      message: 'SMTP connection timeout',
      level: 'warning',
    })
    expect(captureRes.ok).toBe(true)
    if (captureRes.ok) {
      expect(captureRes.data.event.service).toBe('Mail')
    }

    const summaryRes = await client.getSummary({ service: 'Mail' })
    expect(summaryRes.ok).toBe(true)
    if (summaryRes.ok) {
      expect(summaryRes.data.total_errors).toBeGreaterThan(0)
    }
  })
})
