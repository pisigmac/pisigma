export interface Env {
  ANALYTICS_ENV?: string
}

export interface TelemetryEvent {
  event_name: string
  user_id?: string
  tenant_id?: string
  properties?: Record<string, unknown>
  timestamp?: string
}

export interface EventBatchRequest {
  events: TelemetryEvent[]
}
