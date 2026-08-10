export interface RouteEntry {
  path: string;
  upstream_url: string;
  methods?: string[];
  auth_required?: boolean;
}

export interface ProxyResult {
  status: number;
  upstream_response_time_ms: number;
}
