import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaExperiments } from '../src/client'

describe('Experiments Service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-experiments')
    expect(json.environment).toBe('development')
  })

  it('POST /v1/experiments/variant assigns a deterministic variant', async () => {
    const res = await app.request('/v1/experiments/variant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experiment_id: 'checkout_v2', user_id: 'user_123' }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.experiment_id).toBe('checkout_v2')
    expect(json.user_id).toBe('user_123')
    expect(typeof json.variant).toBe('string')

    // Same request should return the exact same variant
    const res2 = await app.request('/v1/experiments/variant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experiment_id: 'checkout_v2', user_id: 'user_123' }),
    })
    const json2 = (await res2.json()) as any
    expect(json2.variant).toBe(json.variant)
  })

  it('POST /v1/experiments/variant returns 400 when missing required fields', async () => {
    const res = await app.request('/v1/experiments/variant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user_123' }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.error).toBeDefined()
  })

  it('POST /v1/experiments/track records an event successfully', async () => {
    const res = await app.request('/v1/experiments/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experiment_id: 'checkout_v2',
        user_id: 'user_123',
        event_name: 'completed_purchase',
        value: 49.99,
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.event_id).toBeDefined()
    expect(json.experiment_id).toBe('checkout_v2')
    expect(json.user_id).toBe('user_123')
    expect(json.event_name).toBe('completed_purchase')
  })

  it('POST /v1/experiments/track returns 400 when missing required fields', async () => {
    const res = await app.request('/v1/experiments/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ experiment_id: 'checkout_v2' }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.error).toBeDefined()
  })

  it('PisigmaExperiments client operates correctly', async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const url = new URL(urlStr)
      const req = new Request(url, init)
      return app.request(req)
    }

    const client = new PisigmaExperiments({ baseUrl: 'http://localhost:8806', fetch: fetchMock as any })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)
    if (health.ok) {
      expect(health.data.service).toBe('pisigma-experiments')
    }

    const variantRes = await client.getVariant({ experiment_id: 'button_color', user_id: 'user_456' })
    expect(variantRes.ok).toBe(true)
    if (variantRes.ok) {
      expect(variantRes.data.experiment_id).toBe('button_color')
      expect(variantRes.data.user_id).toBe('user_456')
    }

    const trackRes = await client.trackEvent({
      experiment_id: 'button_color',
      user_id: 'user_456',
      event_name: 'clicked_button',
    })
    expect(trackRes.ok).toBe(true)
    if (trackRes.ok) {
      expect(trackRes.data.success).toBe(true)
      expect(trackRes.data.event_name).toBe('clicked_button')
    }
  })
})
