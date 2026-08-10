export class PisigmaWorkflows {
  constructor(private baseUrl: string, private apiKey?: string) {}

  private async fetch(path: string, options?: RequestInit) {
    const headers = new Headers(options?.headers);
    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }
    headers.set('Content-Type', 'application/json');
    const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    return res;
  }

  async define(body: any) {
    const res = await this.fetch('/v1/workflows/define', { method: 'POST', body: JSON.stringify(body) });
    return res.json();
  }

  async trigger(id: string) {
    const res = await this.fetch(`/v1/workflows/${id}/trigger`, { method: 'POST' });
    return res.json();
  }

  async status(id: string) {
    const res = await this.fetch(`/v1/workflows/${id}/status`);
    return res.json();
  }

  async approve(id: string) {
    const res = await this.fetch(`/v1/workflows/${id}/approve`, { method: 'POST' });
    return res.json();
  }
}
