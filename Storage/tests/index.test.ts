import { describe, expect, it } from 'vitest'
import app from '../src/index'

describe('Storage service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-storage')
  })

  it('POST /v1/uploads/presigned creates presigned upload URL', async () => {
    const res = await app.request('/v1/uploads/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: 'test.png', mime_type: 'image/png', size_bytes: 1024 }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.file_id).toBeDefined()
    expect(json.upload_url).toContain('/v1/raw-upload/')
  })
})
