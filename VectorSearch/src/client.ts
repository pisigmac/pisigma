export class PisigmaVectorSearch {
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

  async upsert(body: any) {
    const res = await this.fetch('/v1/vectors/upsert', { method: 'POST', body: JSON.stringify(body) });
    return res.json();
  }

  async query(body: any) {
    const res = await this.fetch('/v1/vectors/query', { method: 'POST', body: JSON.stringify(body) });
    return res.json();
  }

  async delete(id: string) {
    const res = await this.fetch(`/v1/vectors/${id}`, { method: 'DELETE' });
    return res.json();
  }

  async collections() {
    const res = await this.fetch('/v1/vectors/collections');
    return res.json();
  }
}
