import { Hono } from 'hono'
import { ReportTemplate, GeneratedReport, ScheduledReport, ReportFilter, ReportColumn } from './types'

const app = new Hono()

const templates = new Map<string, ReportTemplate>()
const generated: GeneratedReport[] = []
const schedules = new Map<string, ScheduledReport>()

function applyFilter(value: unknown, filter: ReportFilter): boolean {
  switch(filter.operator) {
    case 'eq': return value === filter.value
    case 'neq': return value !== filter.value
    case 'gt': return Number(value) > Number(filter.value)
    case 'lt': return Number(value) < Number(filter.value)
    case 'gte': return Number(value) >= Number(filter.value)
    case 'lte': return Number(value) <= Number(filter.value)
    case 'contains': return String(value).includes(String(filter.value))
    case 'in': return Array.isArray(filter.value) && filter.value.includes(value)
    default: return true
  }
}

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'reportbuilder',
    templates_count: templates.size,
    reports_count: generated.length
  })
})

app.post('/v1/reports/templates', async (c) => {
  const body = await c.req.json()
  const template: ReportTemplate = body
  if (!template.columns || template.columns.length === 0) {
    return c.json({ error: 'Columns array must be non-empty' }, 400)
  }
  const id = Date.now().toString()
  const now = new Date().toISOString()
  const newTemplate = { ...template, id, created_at: now, updated_at: now }
  templates.set(id, newTemplate)
  return c.json(newTemplate, 201)
})

app.get('/v1/reports/templates', (c) => {
  return c.json({ templates: Array.from(templates.values()), total: templates.size })
})

app.post('/v1/reports/generate', async (c) => {
  const body = await c.req.json()
  const { template_id, data } = body as { template_id: string, data: Record<string, unknown>[] }
  const template = templates.get(template_id)
  if (!template) {
    return c.json({ error: 'Template not found' }, 404)
  }

  let filteredData = data
  if (template.filters && template.filters.length > 0) {
    filteredData = filteredData.filter(row => {
      return template.filters!.every(filter => applyFilter(row[filter.column], filter))
    })
  }

  if (template.sort_by) {
    const sortField = template.sort_by
    const sortOrder = template.sort_order === 'desc' ? -1 : 1
    filteredData.sort((a, b) => {
      const valA = a[sortField] as any
      const valB = b[sortField] as any
      if (valA < valB) return -1 * sortOrder
      if (valA > valB) return 1 * sortOrder
      return 0
    })
  }

  const summary: Record<string, number> = {}
  template.columns.forEach(col => {
    if (col.aggregation) {
      let values = filteredData.map(row => Number(row[col.name])).filter(n => !isNaN(n))
      if (values.length === 0) return
      
      switch (col.aggregation) {
        case 'sum': summary[col.name] = values.reduce((a, b) => a + b, 0); break;
        case 'avg': summary[col.name] = values.reduce((a, b) => a + b, 0) / values.length; break;
        case 'count': summary[col.name] = values.length; break;
        case 'min': summary[col.name] = Math.min(...values); break;
        case 'max': summary[col.name] = Math.max(...values); break;
      }
    }
  })

  const report: GeneratedReport = {
    id: Date.now().toString(),
    template_id: template.id!,
    template_name: template.name,
    data: filteredData,
    summary,
    generated_at: new Date().toISOString(),
    row_count: filteredData.length,
    export_formats: ['json', 'csv']
  }
  generated.push(report)

  return c.json(report, 201)
})

app.post('/v1/reports/schedule', async (c) => {
  const body = await c.req.json()
  const schedule: ScheduledReport = body
  const id = Date.now().toString()
  const newSchedule = { ...schedule, id, created_at: new Date().toISOString() }
  schedules.set(id, newSchedule)
  return c.json(newSchedule, 201)
})

app.get('/v1/reports/templates/:id', (c) => {
  const id = c.req.param('id')
  const template = templates.get(id)
  if (!template) return c.json({ error: 'Not found' }, 404)
  return c.json(template)
})

app.get('/v1/reports/:id', (c) => {
  const id = c.req.param('id')
  const report = generated.find(r => r.id === id)
  if (!report) return c.json({ error: 'Not found' }, 404)
  return c.json(report)
})

app.get('/v1/reports/:id/export', (c) => {
  const id = c.req.param('id')
  const format = c.req.query('format') || 'json'
  const report = generated.find(r => r.id === id)
  if (!report) return c.json({ error: 'Not found' }, 404)

  if (format === 'csv') {
    if (report.data.length === 0) return c.text('')
    const headers = Object.keys(report.data[0])
    const rows = report.data.map(row => headers.map(h => row[h]).join(','))
    const csv = [headers.join(','), ...rows].join('\\n')
    return new Response(csv, { headers: { 'Content-Type': 'text/csv' } })
  }

  return c.json(report.data)
})

export default app
