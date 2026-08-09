import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaAuditLogs } from '../src/client'

describe('AuditLogs service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-auditlogs')
    expect(json.environment).toBe('development')
  })

  it('POST /v1/audit-logs creates audit log entry', async () => {
    const res = await app.request('/v1/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'user.login',
        actor_id: 'usr_100',
        tenant_id: 'tenant_alpha',
        metadata: { browser: 'Chrome' },
      }),
    })
    expect(res.status).toBe(201)
    const json = (await res.json()) as any
    expect(json.success).toBe(true)
    expect(json.audit_log.action).toBe('user.login')
    expect(json.audit_log.actor_id).toBe('usr_100')
    expect(json.audit_log.id).toBeDefined()
  })

  it('POST /v1/audit-logs returns 400 when missing action or actor_id', async () => {
    const res = await app.request('/v1/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'user.login',
      }),
    })
    expect(res.status).toBe(400)
    const json = (await res.json()) as any
    expect(json.error).toBeDefined()
  })

  it('GET /v1/audit-logs/search filters audit logs by query params', async () => {
    await app.request('/v1/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'document.delete',
        actor_id: 'usr_200',
        tenant_id: 'tenant_beta',
      }),
    })

    const searchRes1 = await app.request('/v1/audit-logs/search?actor_id=usr_100')
    expect(searchRes1.status).toBe(200)
    const searchJson1 = (await searchRes1.json()) as any
    expect(searchJson1.total).toBe(1)
    expect(searchJson1.audit_logs[0].actor_id).toBe('usr_100')

    const searchRes2 = await app.request('/v1/audit-logs/search?action=document.delete')
    expect(searchRes2.status).toBe(200)
    const searchJson2 = (await searchRes2.json()) as any
    expect(searchJson2.total).toBe(1)
    expect(searchJson2.audit_logs[0].actor_id).toBe('usr_200')
  })

  it('PisigmaAuditLogs client operates correctly', async () => {
    const fetchMock = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === 'string' ? input : input.toString()
      const url = new URL(urlStr)
      const req = new Request(url, init)
      return app.request(req)
    }

    const client = new PisigmaAuditLogs({ baseUrl: 'http://localhost:8796', fetch: fetchMock as any })
    const health = await client.checkHealth()
    expect(health.ok).toBe(true)

    const createRes = await client.createLog({
      action: 'role.update',
      actor_id: 'admin_1',
      target_id: 'usr_100',
    })
    expect(createRes.ok).toBe(true)
    if (createRes.ok) {
      expect(createRes.data.audit_log.action).toBe('role.update')
    }

    const searchRes = await client.searchLogs({ actor_id: 'admin_1' })
    expect(searchRes.ok).toBe(true)
    if (searchRes.ok) {
      expect(searchRes.data.total).toBe(1)
      expect(searchRes.data.audit_logs[0].action).toBe('role.update')
    }
  })
})
