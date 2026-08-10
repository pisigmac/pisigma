import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('ConsentManager API', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    expect(await res.json() as any).toEqual({ status: 'ok', service: 'consentmanager' })
  })

  it('POST /v1/consent/record and GET /v1/consent/:userId', async () => {
    const recordRes = await app.request('/v1/consent/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user1', purpose: 'analytics', granted: true })
    })
    expect(recordRes.status).toBe(200)
    const record = await recordRes.json() as any
    expect(record.user_id).toBe('user1')

    const getRes = await app.request('/v1/consent/user1')
    expect(getRes.status).toBe(200)
    const getRecords = await getRes.json() as any
    expect(getRecords.length).toBe(1)
    expect(getRecords[0].purpose).toBe('analytics')
  })

  it('POST /v1/consent/dsar', async () => {
    const res = await app.request('/v1/consent/dsar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user1', type: 'access' })
    })
    expect(res.status).toBe(200)
    const data = await res.json() as any
    expect(data.status).toBe('pending')
    expect(data.id).toBeDefined()
  })

  it('GET /v1/consent/policies', async () => {
    const res = await app.request('/v1/consent/policies')
    expect(res.status).toBe(200)
    const data = await res.json() as any
    expect(data.length).toBeGreaterThan(0)
  })
})
