export type MockDefinition = {
  id?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  response_body: unknown;
  response_status?: number;
  response_headers?: Record<string, string>;
  latency_ms?: number;
  times?: number;
  created_at?: string;
};

export type MockMatch = {
  mock_id: string;
  request_method: string;
  request_path: string;
  request_headers?: Record<string, string>;
  request_body?: unknown;
  response_status: number;
  response_body: unknown;
  matched_at: string;
  latency_ms: number;
};

export type RecordingSession = {
  id: string;
  target_url: string;
  started_at: string;
  requests: MockMatch[];
  status: 'recording' | 'stopped';
};
