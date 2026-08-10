import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('DataRetention API', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect(await res.json() as any).toEqual({ status: 'ok', service: 'dataretention' })
  })

  it('POST /v1/retention/policies and GET /v1/retention/policies', async () => {
    const postRes = await app.request('/v1/retention/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_type: 'logs', retention_days: 30, action: 'delete' })
    })
    expect(postRes.status).toBe(200)
    const policy = await postRes.json() as any
    expect(policy.data_type).toBe('logs')

    const getRes = await app.request('/v1/retention/policies')
    expect(getRes.status).toBe(200)
    const policies = await getRes.json() as any
    expect(policies.length).toBeGreaterThan(0)
    expect(policies[0].data_type).toBe('logs')
  })

  it('POST /v1/retention/execute', async () => {
    const policyRes = await app.request('/v1/retention/policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_type: 'events', retention_days: 90, action: 'archive' })
    })
    const policy = await policyRes.json() as any

    const execRes = await app.request('/v1/retention/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy_id: policy.id })
    })
    expect(execRes.status).toBe(200)
    const exec = await execRes.json() as any
    expect(exec.records_affected).toBeGreaterThanOrEqual(10)
    expect(exec.records_affected).toBeLessThanOrEqual(500)
  })

  it('POST /v1/retention/erasure and GET /v1/retention/erasure/:id', async () => {
    const postRes = await app.request('/v1/retention/erasure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user123' })
    })
    expect(postRes.status).toBe(200)
    const erasure = await postRes.json() as any
    expect(erasure.user_id).toBe('user123')
    expect(erasure.status).toBe('pending')

    const getRes = await app.request(`/v1/retention/erasure/${erasure.id}`)
    expect(getRes.status).toBe(200)
    const getErasure = await getRes.json() as any
    expect(getErasure.id).toBe(erasure.id)
    expect(getErasure.user_id).toBe('user123')
  })
})
