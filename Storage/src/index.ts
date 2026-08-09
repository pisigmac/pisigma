import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, PresignedUploadRequest } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-storage',
    bucket: c.env?.STORAGE_BUCKET_NAME || 'pisigma-dev-bucket',
    configured: true,
  })
})

app.post('/v1/uploads/presigned', async (c) => {
  const body = await c.req.json<PresignedUploadRequest>()
  if (!body.filename || !body.mime_type) {
    return c.json({ error: 'invalid_request', message: 'filename and mime_type are required' }, 400)
  }

  const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  const ttl = body.ttl_seconds || 3600
  const expiresAt = Math.floor(Date.now() / 1000) + ttl
  const baseUrl = c.env?.STORAGE_BASE_URL || 'http://127.0.0.1:8790'

  return c.json({
    file_id: fileId,
    upload_url: `${baseUrl}/v1/raw-upload/${fileId}?expires=${expiresAt}`,
    expires_at: expiresAt,
  })
})

app.post('/v1/downloads/presigned', async (c) => {
  const body = await c.req.json<{ file_id: string; ttl_seconds?: number }>()
  if (!body.file_id) {
    return c.json({ error: 'invalid_request', message: 'file_id is required' }, 400)
  }
  const ttl = body.ttl_seconds || 3600
  const expiresAt = Math.floor(Date.now() / 1000) + ttl
  const baseUrl = c.env?.STORAGE_BASE_URL || 'http://127.0.0.1:8790'

  return c.json({
    download_url: `${baseUrl}/v1/raw-download/${body.file_id}?expires=${expiresAt}`,
    expires_at: expiresAt,
  })
})

export default app
