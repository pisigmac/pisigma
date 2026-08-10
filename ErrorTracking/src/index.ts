import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, CaptureErrorRequest, ErrorEvent, ErrorSummary, ErrorLevel } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const errorsStore: ErrorEvent[] = []

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-error-tracking',
    environment: c.env?.ERRORTRACKING_ENV || 'development',
  })
})

app.post('/v1/errors/capture', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Partial<CaptureErrorRequest>

  if (!body.service || typeof body.service !== 'string' || body.service.trim() === '') {
    return c.json({ error: 'Service name is required' }, 400)
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim() === '') {
    return c.json({ error: 'Error message is required' }, 400)
  }

  const validLevels: ErrorLevel[] = ['info', 'warning', 'error', 'fatal']
  const level: ErrorLevel = body.level && validLevels.includes(body.level) ? body.level : 'error'

  const id = `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  const event: ErrorEvent = {
    id,
    service: body.service.trim(),
    message: body.message.trim(),
    stack: body.stack,
    level,
    metadata: body.metadata,
    timestamp: new Date().toISOString(),
  }

  errorsStore.push(event)

  return c.json({ success: true, event }, 201)
})

app.get('/v1/errors/summary', (c) => {
  const serviceFilter = c.req.query('service')?.trim()
  const levelFilter = c.req.query('level')?.trim()

  let filtered = errorsStore
  if (serviceFilter) {
    filtered = filtered.filter((e) => e.service.toLowerCase() === serviceFilter.toLowerCase())
  }
  if (levelFilter) {
    filtered = filtered.filter((e) => e.level.toLowerCase() === levelFilter.toLowerCase())
  }

  const errorsByService: Record<string, number> = {}
  const errorsByLevel: Record<string, number> = {}

  for (const err of filtered) {
    errorsByService[err.service] = (errorsByService[err.service] || 0) + 1
    errorsByLevel[err.level] = (errorsByLevel[err.level] || 0) + 1
  }

  const recentErrors = [...filtered].reverse().slice(0, 10)

  const summary: ErrorSummary = {
    total_errors: filtered.length,
    errors_by_service: errorsByService,
    errors_by_level: errorsByLevel,
    recent_errors: recentErrors,
  }

  return c.json(summary)
})

export default app
