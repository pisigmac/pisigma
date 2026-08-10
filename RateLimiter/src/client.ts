import { RateLimitRule, RateLimitResult } from './types';

export class PisigmaRateLimiter {
  constructor(private baseUrl: string, private apiKey?: string) {}

  private async fetch(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    if (this.apiKey) headers.set('Authorization', `Bearer ${this.apiKey}`);
    headers.set('Content-Type', 'application/json');
    
    const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    return res;
  }

  async check(key: string, limit?: number, window_seconds?: number): Promise<RateLimitResult> {
    const res = await this.fetch('/v1/ratelimit/check', {
      method: 'POST',
      body: JSON.stringify({ key, limit, window_seconds })
    });
    return res.json() as any;
  }

  async configure(rule: RateLimitRule): Promise<RateLimitRule> {
    const res = await this.fetch('/v1/ratelimit/config', {
      method: 'POST',
      body: JSON.stringify(rule)
    });
    return res.json() as any;
  }

  async stats(): Promise<any> {
    const res = await this.fetch('/v1/ratelimit/stats');
    return res.json() as any;
  }
}