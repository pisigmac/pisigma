export interface Env {
  AUDIT_LOGS_ENV?: string
}

export interface AuditLog {
  id?: string
  action: string
  actor_id: string
  target_id?: string
  tenant_id?: string
  metadata?: Record<string, unknown>
  ip_address?: string
  timestamp?: string
}

export interface AuditLogsSearchQuery {
  actor_id?: string
  action?: string
  tenant_id?: string
  limit?: number
}
