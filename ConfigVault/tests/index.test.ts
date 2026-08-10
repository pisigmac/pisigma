import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('ConfigVault', () => {
  it('should return health status', async () => {
    const res = await app.request('/health')
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(json.status).toBe('ok')
    expect(json.service).toBe('configvault')
  })

  it('should set and get config', async () => {
    const putRes = await app.request('/v1/config/default/test-key', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 'test-value' })
    })
    const putJson = (await putRes.json()) as any
    expect(putRes.status).toBe(200)
    expect(putJson.value).toBe('test-value')
    expect(putJson.version).toBe(1)

    const getRes = await app.request('/v1/config/default/test-key')
    const getJson = (await getRes.json()) as any
    expect(getRes.status).toBe(200)
    expect(getJson.value).toBe('test-value')
  })

  it('should rotate secret', async () => {
    const res = await app.request('/v1/config/rotate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namespace: 'default', key: 'test-key', new_value: 'new-test-value' })
    })
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(json.rotated).toBe(true)
    expect(json.version).toBe(2)
  })

  it('should get snapshot', async () => {
    const res = await app.request('/v1/config/default/snapshot')
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(json.namespace).toBe('default')
    expect(json.entries.length).toBeGreaterThan(0)
  })
})
