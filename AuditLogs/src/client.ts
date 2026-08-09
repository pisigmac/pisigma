/**
 * Tiny typed client for PiSigma AuditLogs Service.
 * Usage:
 *   const audit = new PisigmaAuditLogs({ baseUrl })
 *   await audit.createLog({ action: 'user.login', actor_id: 'usr_123' })
 */
import type { AuditLog, AuditLogsSearchQuery } from './types'

export type AuditLogsClientOptions = {
  baseUrl: string
  apiKey?: string
  fetch?: typeof fetch
}

export type ClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; detail?: unknown }

export class PisigmaAuditLogs {
  private baseUrl: string
  private apiKey?: string
  private fetchFn: typeof fetch

  constructor(opts: AuditLogsClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '')
    this.apiKey = opts.apiKey
    this.fetchFn = opts.fetch || fetch
  }

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.apiKey) h['Authorization'] = `Bearer ${this.apiKey}`
    return h
  }

  async checkHealth(): Promise<ClientResult<{ status: string; service: string; environment?: string; total_logs?: number }>> {
    const res = await this.fetchFn(`${this.baseUrl}/health`)
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        status: String(json.status),
        service: String(json.service),
        environment: json.environment ? String(json.environment) : undefined,
        total_logs: typeof json.total_logs === 'number' ? json.total_logs : undefined,
      },
    }
  }

  async createLog(input: AuditLog): Promise<ClientResult<{ success: boolean; audit_log: AuditLog }>> {
    const res = await this.fetchFn(`${this.baseUrl}/v1/audit-logs`, {
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
        audit_log: json.audit_log as AuditLog,
      },
    }
  }

  async searchLogs(query?: AuditLogsSearchQuery): Promise<ClientResult<{ total: number; audit_logs: AuditLog[] }>> {
    const params = new URLSearchParams()
    if (query?.actor_id) params.set('actor_id', query.actor_id)
    if (query?.action) params.set('action', query.action)
    if (query?.tenant_id) params.set('tenant_id', query.tenant_id)
    if (query?.limit !== undefined) params.set('limit', String(query.limit))

    const queryString = params.toString() ? `?${params.toString()}` : ''
    const res = await this.fetchFn(`${this.baseUrl}/v1/audit-logs/search${queryString}`, {
      headers: this.headers(),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok) return { ok: false, status: res.status, error: String(json.error || res.statusText) }
    return {
      ok: true,
      data: {
        total: Number(json.total || 0),
        audit_logs: (json.audit_logs as AuditLog[]) || [],
      },
    }
  }
}
