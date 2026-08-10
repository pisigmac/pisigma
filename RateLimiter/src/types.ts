export interface RateLimitRule {
  key: string;
  limit: number;
  window_seconds: number;
  strategy?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_at: number;
  retry_after?: number;
}