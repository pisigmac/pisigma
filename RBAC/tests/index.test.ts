import { describe, expect, it } from 'vitest'
import app from '../src/index'
import { PisigmaRBAC } from '../src/client'

describe('RBAC Service', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health')
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.status).toBe('ok')
    expect(json.service).toBe('pisigma-rbac')
  })

  it('POST /v1/rbac/can allows admin for any action', async () => {
    const res = await app.request('/v1/rbac/can', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: ['admin'], action: 'delete_database' }),
    })
    expect(res.status).toBe(200)
    const json = (await res.json()) as any
    expect(json.allowed).toBe(true)
    expect(json.matched_role).toBe('admin')
  })

  it('POST /v1/rbac/can handles viewer role correctly (allow read, deny delete)', async () => {
    const readRes = await app.request('/v1/rbac/can', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: ['viewer'], action: 'read' }),
    })
    expect(readRes.status).toBe(200)
    const readJson = (await readRes.json()) as any
    expect(readJson.allowed).toBe(true)

    const deleteRes = await app.request('/v1/rbac/can', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: ['viewer'], action: 'delete' }),
    })
    expect(deleteRes.status).toBe(200)
    const deleteJson = (await deleteRes.json()) as any
    expect(deleteJson.allowed).toBe(false)
  })

  it('POST /v1/rbac/roles creates a new role and tests permission check with it', async () => {
    const createRes = await app.request('/v1/rbac/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'auditor',
        description: 'Auditor role',
        permissions: ['audit:read'],
      }),
    })
    expect(createRes.status).toBe(200)
    const createJson = (await createRes.json()) as any
    expect(createJson.success).toBe(true)
    expect(createJson.role.name).toBe('auditor')

    const canRes = await app.request('/v1/rbac/can', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: ['auditor'], action: 'read', resource: 'audit' }),
    })
    expect(canRes.status).toBe(200)
    const canJson = (await canRes.json()) as any
    expect(canJson.allowed).toBe(true)
  })

  it('PisigmaRBAC client works correctly with app fetch mock', async () => {
    const client = new PisigmaRBAC({
      baseUrl: 'http://127.0.0.1:8799',
      fetch: async (url, init) => app.request(url, init),
    })

    const health = await client.checkHealth()
    expect(health.ok).toBe(true)
    if (health.ok) {
      expect(health.data.service).toBe('pisigma-rbac')
    }

    const check = await client.can({ roles: ['editor'], action: 'write' })
    expect(check.ok).toBe(true)
    if (check.ok) {
      expect(check.data.allowed).toBe(true)
    }

    const roles = await client.getRoles()
    expect(roles.ok).toBe(true)
    if (roles.ok) {
      expect(roles.data.roles.length).toBeGreaterThan(0)
    }
  })
})
