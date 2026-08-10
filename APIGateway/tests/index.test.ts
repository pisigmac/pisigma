import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('APIGateway', () => {
  it('should return health status', async () => {
    const res = await app.request('/health')
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(json.status).toBe('ok')
    expect(json.service).toBe('apigateway')
  })

  it('should register route', async () => {
    const res = await app.request('/v1/gateway/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'test-path', upstream_url: 'http://test.com' })
    })
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(json.path).toBe('test-path')
    expect(json.upstream_url).toBe('http://test.com')
  })

  it('should list routes', async () => {
    const res = await app.request('/v1/gateway/routes')
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBeGreaterThan(0)
    expect(json[0].path).toBe('test-path')
  })

  it('should delete route', async () => {
    const encoded = encodeURIComponent('test-path')
    const res = await app.request(`/v1/gateway/routes/${encoded}`, {
      method: 'DELETE'
    })
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(json.deleted).toBe(true)
  })
})
