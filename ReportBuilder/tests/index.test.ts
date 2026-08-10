import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('ReportBuilder API', () => {
  it('should return health status', async () => {
    const res = await app.request('/health')
    const json = await res.json() as any
    expect(res.status).toBe(200)
    expect(json.status).toBe('ok')
    expect(json.service).toBe('reportbuilder')
  })

  let templateId: string;

  it('should create template', async () => {
    const res = await app.request('/v1/reports/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'RevReport',
        columns: [
          { name: 'revenue', label: 'Revenue', type: 'number', aggregation: 'sum' },
          { name: 'region', label: 'Region', type: 'string' }
        ]
      })
    })
    const json = await res.json() as any
    expect(res.status).toBe(201)
    expect(json.id).toBeDefined()
    templateId = json.id
  })

  it('should generate report and verify summary', async () => {
    const res = await app.request('/v1/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        data: [
          { revenue: 100, region: 'US' },
          { revenue: 200, region: 'EU' },
          { revenue: 150, region: 'US' }
        ]
      })
    })
    const json = await res.json() as any
    expect(res.status).toBe(201)
    expect(json.summary).toBeDefined()
    expect(json.summary.revenue).toBe(450)
  })

  it('should export as CSV', async () => {
    const generateRes = await app.request('/v1/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        data: [
          { revenue: 100, region: 'US' },
          { revenue: 200, region: 'EU' }
        ]
      })
    })
    const genJson = await generateRes.json() as any
    const reportId = genJson.id

    const res = await app.request(`/v1/reports/${reportId}/export?format=csv`)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('revenue,region')
    expect(text).toContain('100,US')
  })

  it('should create schedule', async () => {
    const res = await app.request('/v1/reports/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template_id: templateId,
        format: 'json',
        cron: '* * * * *'
      })
    })
    const json = await res.json() as any
    expect(res.status).toBe(201)
    expect(json.id).toBeDefined()
  })

  it('should get template by ID', async () => {
    const res = await app.request(`/v1/reports/templates/${templateId}`)
    const json = await res.json() as any
    expect(res.status).toBe(200)
    expect(json.name).toBe('RevReport')
  })
})
