import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, MediaTransformRequest, TransformPreset } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const PRESETS: TransformPreset[] = [
  {
    id: 'avatar_thumb',
    name: 'Avatar Thumbnail',
    description: 'Square thumbnail suitable for user profile images',
    format: 'webp',
    width: 150,
    height: 150,
    quality: 80,
  },
  {
    id: 'hero_banner',
    name: 'Hero Banner',
    description: 'High resolution landscape banner image',
    format: 'webp',
    width: 1920,
    height: 1080,
    quality: 85,
  },
  {
    id: 'audio_mp3_standard',
    name: 'Audio MP3 Standard',
    description: 'Standard 128kbps MP3 audio encoding',
    format: 'mp3',
    quality: 128,
  },
  {
    id: 'hd_video',
    name: 'HD Video MP4',
    description: '1080p MP4 H.264 video encoding',
    format: 'mp4',
    width: 1920,
    height: 1080,
  },
]

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-mediaprocessing',
    engine: c.env?.MEDIA_PROCESSING_ENGINE || 'default',
    max_file_size_mb: Number(c.env?.MAX_FILE_SIZE_MB || '100'),
    configured: true,
  })
})

app.get('/v1/media/presets', (c) => {
  return c.json({
    presets: PRESETS,
    count: PRESETS.length,
  })
})

app.post('/v1/media/transform', async (c) => {
  const body = await c.req.json<MediaTransformRequest>().catch(() => ({} as MediaTransformRequest))
  if (!body || !body.source_url || !body.target_format) {
    return c.json(
      { error: 'invalid_request', message: 'source_url and target_format are required' },
      400
    )
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  const outputUrl = `http://127.0.0.1:8802/v1/media/output/${jobId}.${body.target_format}`

  return c.json({
    job_id: jobId,
    status: 'completed',
    source_url: body.source_url,
    target_format: body.target_format,
    output_url: outputUrl,
    width: body.width || (body.preset === 'avatar_thumb' ? 150 : 800),
    height: body.height || (body.preset === 'avatar_thumb' ? 150 : 600),
    created_at: new Date().toISOString(),
  })
})

export default app
