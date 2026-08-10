export interface Env {
  APITESTER_ENV?: string
}

export interface TestRunRequest {
  url: string
  method?: string
  headers?: Record<string, string>
  body?: unknown
  expected_status?: number
  timeout_ms?: number
}

export interface TestRunResult {
  success: boolean
  url: string
  method: string
  status_code: number
  response_time_ms: number
  body?: unknown
  matched_expected_status: boolean
  error?: string
  timestamp: string
}

export interface BenchmarkRequest {
  url: string
  method?: string
  iterations?: number
  concurrency?: number
  headers?: Record<string, string>
  body?: unknown
  expected_status?: number
}

export interface BenchmarkResult {
  url: string
  method: string
  total_requests: number
  successful_requests: number
  failed_requests: number
  avg_response_time_ms: number
  min_response_time_ms: number
  max_response_time_ms: number
  requests_per_second: number
  timestamp: string
}
