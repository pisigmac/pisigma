import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaScheduler } from '../src/client'

describe('Scheduler service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-scheduler')
  })

  it('POST /v1/jobs/schedule creates a job', async () => {
    const res = await app.request('/v1/jobs/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'daily_cleanup',
        target_url: 'http://127.0.0.1:8790/v1/cleanup',
        cron_expression: '0 0 * * *',
      }),
    })
    expect(res.status).toBe(201)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.job.id).toBeDefined()
    expect(json.job.status).toBe('scheduled')

    const getRes = await app.request(`/v1/jobs/${json.job.id}`)
    expect(getRes.status).toBe(200)
    const getJson = (await getRes.json()) as any
    expect(getJson.job.name).toBe('daily_cleanup')
  })

  it('GET /v1/jobs/:id returns 404 for unknown job', async () => {
    const res = await app.request('/v1/jobs/non_existent_id')
    expect(res.status).toBe(404)
    const json = (await res.json()) as any
    expect(json.error).toBe('not_found')
  })

  it('PisigmaScheduler client works correctly', async () => {
    const client = new PisigmaScheduler({
      baseUrl: 'http://localhost:8795',
      fetch: async (url, init) => app.request(url, init),
    })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)

    const scheduleRes = await client.schedule({
      name: 'sync_telemetry',
      target_url: 'http://127.0.0.1:8793/v1/sync',
    })
    expect(scheduleRes.ok).toBe(true)

    if (scheduleRes.ok) {
      const jobId = scheduleRes.data.job.id
      const jobRes = await client.getJob(jobId)
      expect(jobRes.ok).toBe(true)
      if (jobRes.ok) {
        expect(jobRes.data.job.name).toBe('sync_telemetry')
      }
    }
  })
})
