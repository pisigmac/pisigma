import { ServiceInstance, ServiceDependency, TopologyResponse, ClientResult } from './types';

export class PisigmaServiceRegistry {
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

  async register(service: ServiceInstance): Promise<ClientResult<ServiceInstance>> {
    return this.request('/v1/services/register', 'POST', service);
  }

  async list(): Promise<ClientResult<{ services: ServiceInstance[], total: number }>> {
    return this.request('/v1/services', 'GET');
  }

  async get(name: string): Promise<ClientResult<ServiceInstance>> {
    return this.request(`/v1/services/${name}`, 'GET');
  }

  async remove(name: string): Promise<ClientResult<{ deleted: boolean, name: string }>> {
    return this.request(`/v1/services/${name}`, 'DELETE');
  }

  async addDependency(dep: ServiceDependency): Promise<ClientResult<ServiceDependency>> {
    return this.request('/v1/services/dependencies', 'POST', dep);
  }

  async topology(): Promise<ClientResult<TopologyResponse>> {
    return this.request('/v1/services/topology', 'GET');
  }
}
