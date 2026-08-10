export type InterceptRule = {
  id?: string;
  source_service: string;
  target_service: string;
  capture_headers?: boolean;
  capture_body?: boolean;
  active?: boolean;
  created_at?: string;
};

export type CapturedRequest = {
  id: string;
  rule_id: string;
  method: string;
  url: string;
  request_headers?: Record<string, string>;
  request_body?: unknown;
  response_status?: number;
  response_headers?: Record<string, string>;
  response_body?: unknown;
  latency_ms: number;
  timestamp: string;
  source_service: string;
  target_service: string;
};

export type ProxyStats = {
  total_captured: number;
  by_service: Record<string, number>;
  avg_latency_ms: number;
  error_rate: number;
  p95_latency_ms: number;
};
