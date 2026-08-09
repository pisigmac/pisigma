/**
 * Typed client for PiSigma RBAC Service.
 * Usage:
 *   const rbac = new PisigmaRBAC({ baseUrl })
 *   const check = await rbac.can({ roles: ['editor'], action: 'write' })
 *   await rbac.createRole({ name: 'auditor', permissions: ['audit:read'] })
 */
import type { CanRequest, CanResponse, CreateRoleRequest, Role } from './types'

export type RBACClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaRBAC {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: RBACClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`
    return h
  }

  async checkHealth(): Promise<ClientResult<{ status: string; service: string; environment?: string; total_roles?: number }>> {
    const res = await this.fetchFn(`${this.baseUrl}/health`)
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        status: String(json.status),
        service: String(json.service),
        environment: json.environment ? String(json.environment) : undefined,
        total_roles: typeof json.total_roles === 'number' ? json.total_roles : undefined,
      },
    }
  }

  async can(input: CanRequest): Promise<ClientResult<CanResponse>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/rbac/can`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })
    const json = (await res.json().catch(() => ({}))) as CanResponse
    if (!res.ok) return { ok: false, status: res.status, error: json.reason || res.statusText }
    return {
      ok: true,
      data: json,
    }
  }

  async createRole(input: CreateRoleRequest): Promise<ClientResult<{ success: boolean; role: Role }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/rbac/roles`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        success: Boolean(json.success),
        role: json.role as Role,
      },
    }
  }

  async getRoles(): Promise<ClientResult<{ roles: Role[] }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/rbac/roles`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        roles: (json.roles as Role[]) || [],
      },
    }
  }
}
