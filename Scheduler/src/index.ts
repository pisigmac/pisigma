import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, Job, JobInput } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const jobsStore = new Map<string, Job>()

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-scheduler',
    environment: c.env?.SCHEDULER_ENV || 'development',
    max_concurrent_jobs: Number(c.env?.SCHEDULER_MAX_CONCURRENT_JOBS || '10'),
    active_jobs: jobsStore.size,
  })
})

app.post('/v1/jobs/schedule', async (c) => {
  const body = await c.req.json<JobInput>().catch(() => ({} as JobInput))

  if (!body.name || !body.target_url) {
    return c.json({ error: 'invalid_request', message: 'name and target_url are required' }, 400)
  }

  const now = new Date()
  const delaySec = body.delay_seconds || 0
  const executeAt = new Date(now.getTime() + delaySec * 1000).toISOString()

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  const job: Job = {
    id: jobId,
    name: body.name,
    target_url: body.target_url,
    cron_expression: body.cron_expression,
    payload: body.payload,
    status: 'scheduled',
    scheduled_at: now.toISOString(),
    execute_at: executeAt,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  }

  jobsStore.set(jobId, job)

  return c.json({ success: true, job }, 201)
})

app.get('/v1/jobs/:id', (c) => {
  const id = c.req.param('id')
  const job = jobsStore.get(id)
  if (!job) {
    return c.json({ error: 'not_found', message: 'Job not found' }, 404)
  }
  return c.json({ job })
})

export default app
