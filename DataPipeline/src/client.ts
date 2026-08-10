export class PisigmaDataPipeline {
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

  async createJob(body: any) {
    const res = await this.fetch('/v1/pipeline/jobs', { method: 'POST', body: JSON.stringify(body) });
    return res.json();
  }

  async runJob(id: string) {
    const res = await this.fetch(`/v1/pipeline/jobs/${id}/run`, { method: 'POST' });
    return res.json();
  }

  async jobStatus(id: string) {
    const res = await this.fetch(`/v1/pipeline/jobs/${id}/status`);
    return res.json();
  }

  async transform(body: any) {
    const res = await this.fetch('/v1/pipeline/transform', { method: 'POST', body: JSON.stringify(body) });
    return res.json();
  }
}
