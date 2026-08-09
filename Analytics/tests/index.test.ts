import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('Analytics service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-analytics')
  })

  it('POST /v1/events ingests telemetry events', async () => {
    const res = await app.request('/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: 'user_login', user_id: 'usr_100' }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)

    const statsRes = await app.request('/v1/stats/summary')
    expect(statsRes.status).toBe(200)
    const stats = (await statsRes.json()) as any
    expect(stats.event_counts.user_login).toBe(1)
  })
})
