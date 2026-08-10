import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('AlertEngine API', () => {
  it('should return health status', async () => {
    const res = await app.request('/health')
    const json = await res.json() as any
    expect(res.status).toBe(200)
    expect(json.status).toBe('ok')
    expect(json.service).toBe('alertengine')
  })

  let ruleId: string;

  it('should create rule', async () => {
    const res = await app.request('/v1/alerts/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'High Errors',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 5,
        severity: 'critical'
      })
    })
    const json = await res.json() as any
    expect(res.status).toBe(201)
    expect(json.id).toBeDefined()
    ruleId = json.id
  })

  it('evaluate no alerts triggered', async () => {
    const res = await app.request('/v1/alerts/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric: 'error_rate', value: 3 })
    })
    const json = await res.json() as any
    expect(json.triggered.length).toBe(0)
  })

  it('evaluate alert triggered', async () => {
    const res = await app.request('/v1/alerts/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric: 'error_rate', value: 10 })
    })
    const json = await res.json() as any
    expect(json.triggered.length).toBe(1)
    expect(json.triggered[0].actual_value).toBe(10)
  })

  it('evaluate skipped due to cooldown', async () => {
    const res = await app.request('/v1/alerts/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric: 'error_rate', value: 10 })
    })
    const json = await res.json() as any
    expect(json.skipped_cooldown).toBe(1)
    expect(json.triggered.length).toBe(0)
  })

  it('should acknowledge alert', async () => {
    const historyRes = await app.request('/v1/alerts/history')
    const historyJson = await historyRes.json() as any
    const eventId = historyJson.events[0].id

    const res = await app.request(`/v1/alerts/${eventId}/acknowledge`, { method: 'POST' })
    const json = await res.json() as any
    expect(json.acknowledged).toBe(true)
  })

  it('should create escalation policy', async () => {
    const res = await app.request('/v1/alerts/escalation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Critical Policy',
        levels: [
          { delay_minutes: 0, channel: 'slack', target: '#oncall' },
          { delay_minutes: 15, channel: 'pagerduty', target: 'oncall-pager' }
        ]
      })
    })
    const json = await res.json() as any
    expect(res.status).toBe(201)
  })

  it('history filters by severity', async () => {
    const res = await app.request('/v1/alerts/history?severity=critical')
    const json = await res.json() as any
    expect(json.events.length).toBeGreaterThan(0)
  })
})
