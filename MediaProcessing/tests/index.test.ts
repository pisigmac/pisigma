import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('MediaProcessing service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-mediaprocessing')
    expect(json.engine).toBe('default')
  })

  it('GET /v1/media/presets returns preset list', async () => {
    const res = await app.request('/v1/media/presets')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(Array.isArray(json.presets)).toBe(true)
    expect(json.count).toBeGreaterThan(0)
    expect(json.presets[0].id).toBeDefined()
  })

  it('POST /v1/media/transform transforms media successfully', async () => {
    const res = await app.request('/v1/media/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_url: 'https://example.com/sample.png',
        target_format: 'webp',
        width: 300,
        height: 300,
      }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.job_id).toBeDefined()
    expect(json.status).toBe('completed')
    expect(json.output_url).toContain('.webp')
  })

  it('POST /v1/media/transform returns 400 on missing required fields', async () => {
    const res = await app.request('/v1/media/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.error).toBe('invalid_request')
  })
})
