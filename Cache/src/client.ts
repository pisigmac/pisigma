import { CacheStats } from './types';

export class PisigmaCache {
  constructor(private baseUrl: string, private apiKey?: string) {}

  private async fetch(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    if (this.apiKey) headers.set('Authorization', `Bearer ${this.apiKey}`);
    headers.set('Content-Type', 'application/json');
    return fetch(`${this.baseUrl}${path}`, { ...options, headers });
  }

  async get(namespace: string, key: string): Promise<any> {
    const res = await this.fetch(`/v1/cache/${namespace}/${key}`);
    return res.json() as any;
  }

  async set(namespace: string, key: string, value: any, ttl?: number): Promise<any> {
    const res = await this.fetch(`/v1/cache/${namespace}/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value, ttl })
    });
    return res.json() as any;
  }

  async del(namespace: string, key: string): Promise<any> {
    const res = await this.fetch(`/v1/cache/${namespace}/${key}`, {
      method: 'DELETE'
    });
    return res.json() as any;
  }

  async flush(namespace: string): Promise<any> {
    const res = await this.fetch(`/v1/cache/${namespace}`, {
      method: 'DELETE'
    });
    return res.json() as any;
  }

  async stats(namespace: string): Promise<CacheStats> {
    const res = await this.fetch(`/v1/cache/${namespace}/stats`);
    return res.json() as any;
  }
}