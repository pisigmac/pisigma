import { GenerateRequest, RelatedRequest, SchemaDefinition, GeneratedRecord, ClientResult } from './types';

export class PisigmaTestDataFactory {
  private baseUrl: string;
  private apiKey?: string;
  private fetchFn: typeof fetch;

  constructor(opts: { baseUrl: string; apiKey?: string; fetch?: typeof fetch }) {
    this.baseUrl = opts.baseUrl;
    this.apiKey = opts.apiKey;
    this.fetchFn = opts.fetch || globalThis.fetch.bind(globalThis);
  }

  private async request<T>(path: string, method: string = 'GET', body?: any): Promise<ClientResult<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const res = await this.fetchFn(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { error: errorText || res.statusText };
      }

      const data = await res.json() as T;
      return { data };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async generate(req: GenerateRequest): Promise<ClientResult<{ data: GeneratedRecord[], count: number }>> {
    return this.request('/v1/generate', 'POST', req);
  }

  async generateRelated(req: RelatedRequest): Promise<ClientResult<{ data: Record<string, GeneratedRecord[]> }>> {
    return this.request('/v1/generate/related', 'POST', req);
  }

  async listSchemas(): Promise<ClientResult<{ schemas: SchemaDefinition[] }>> {
    return this.request('/v1/schemas', 'GET');
  }

  async createSchema(schema: Omit<SchemaDefinition, 'id' | 'created_at'>): Promise<ClientResult<SchemaDefinition>> {
    return this.request('/v1/schemas', 'POST', schema);
  }
}
