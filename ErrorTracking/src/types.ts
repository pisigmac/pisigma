export interface Env {
  ERRORTRACKING_ENV?: string
}

export type ErrorLevel = 'info' | 'warning' | 'error' | 'fatal'

export interface CaptureErrorRequest {
  service: string
  message: string
  stack?: string
  level?: ErrorLevel
  metadata?: Record<string, unknown>
}

export interface ErrorEvent {
  id: string
  service: string
  message: string
  stack?: string
  level: ErrorLevel
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface ErrorSummary {
  total_errors: number
  errors_by_service: Record<string, number>
  errors_by_level: Record<string, number>
  recent_errors: ErrorEvent[]
}
