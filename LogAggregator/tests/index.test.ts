import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('LogAggregator', () => {
  it('should return health status', async () => {
    const res = await app.request('/health')
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(json.status).toBe('ok')
    expect(json.service).toBe('logaggregator')
  })

  it('should ingest log', async () => {
    const res = await app.request('/v1/logs/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'test-service', level: 'info', message: 'test message' })
    })
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(json.ingested).toBe(true)
    expect(json.id).toBeDefined()
  })

  it('should search by service', async () => {
    const res = await app.request('/v1/logs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service: 'test-service' })
    })
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBeGreaterThan(0)
    expect(json[0].service).toBe('test-service')
  })

  it('should search by level', async () => {
    const res = await app.request('/v1/logs/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: 'info' })
    })
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(Array.isArray(json)).toBe(true)
    expect(json.length).toBeGreaterThan(0)
    expect(json[0].level).toBe('info')
  })

  it('should get stats', async () => {
    const res = await app.request('/v1/logs/stats')
    const json = (await res.json()) as any
    expect(res.status).toBe(200)
    expect(json.total).toBeGreaterThan(0)
    expect(json.by_service['test-service']).toBeGreaterThan(0)
    expect(json.by_level['info']).toBeGreaterThan(0)
  })
})
