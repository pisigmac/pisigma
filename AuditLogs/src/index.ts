import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, AuditLog } from './types'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

const auditLogStore: AuditLog[] = []

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'pisigma-auditlogs',
    environment: c.env?.AUDIT_LOGS_ENV || 'development',
    total_logs: auditLogStore.length,
  })
})

app.post('/v1/audit-logs', async (c) => {
  const body = await c.req.json<AuditLog>().catch(() => ({} as AuditLog))
  if (!body.action || !body.actor_id) {
    return c.json({ error: 'Missing required fields: action and actor_id are required' }, 400)
  }

  const log: AuditLog = {
    id: body.id || `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    action: body.action,
    actor_id: body.actor_id,
    target_id: body.target_id,
    tenant_id: body.tenant_id,
    metadata: body.metadata || {},
    ip_address: body.ip_address || c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1',
    timestamp: body.timestamp || new Date().toISOString(),
  }

  auditLogStore.push(log)
  return c.json({ success: true, audit_log: log }, 201)
})

app.get('/v1/audit-logs/search', (c) => {
  const actorId = c.req.query('actor_id')
  const action = c.req.query('action')
  const tenantId = c.req.query('tenant_id')
  const limitParam = c.req.query('limit')
  const limit = limitParam ? parseInt(limitParam, 10) : 50

  let results = auditLogStore.filter((log) => {
    if (actorId && log.actor_id !== actorId) return false
    if (action && log.action !== action) return false
    if (tenantId && log.tenant_id !== tenantId) return false
    return true
  })

  if (limit > 0) {
    results = results.slice(0, limit)
  }

  return c.json({
    total: results.length,
    audit_logs: results,
  })
})

export default app
