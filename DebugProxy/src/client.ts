import { InterceptRule, CapturedRequest, ProxyStats } from './types';

export class PisigmaDebugProxy {
  constructor(private baseUrl: string) {}

  async createRule(rule: InterceptRule): Promise<InterceptRule> {
    const res = await fetch(`${this.baseUrl}/v1/proxy/intercept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule),
    });
    return res.json();
  }

  async listRules(): Promise<InterceptRule[]> {
    const res = await fetch(`${this.baseUrl}/v1/proxy/rules`);
    return res.json();
  }

  async deleteRule(id: string): Promise<{ deleted: boolean; id: string }> {
    const res = await fetch(`${this.baseUrl}/v1/proxy/rules/${id}`, { method: 'DELETE' });
    return res.json();
  }

  async capture(request: Partial<CapturedRequest>): Promise<CapturedRequest> {
    const res = await fetch(`${this.baseUrl}/v1/proxy/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return res.json();
  }

  async listRequests(query: Record<string, string> = {}): Promise<{ requests: CapturedRequest[]; total: number }> {
    const q = new URLSearchParams(query).toString();
    const url = `${this.baseUrl}/v1/proxy/requests` + (q ? `?${q}` : '');
    const res = await fetch(url);
    return res.json();
  }

  async getRequest(id: string): Promise<CapturedRequest> {
    const res = await fetch(`${this.baseUrl}/v1/proxy/requests/${id}`);
    return res.json();
  }

  async clearRequests(): Promise<{ cleared: boolean; count: number }> {
    const res = await fetch(`${this.baseUrl}/v1/proxy/requests`, { method: 'DELETE' });
    return res.json();
  }

  async stats(): Promise<ProxyStats> {
    const res = await fetch(`${this.baseUrl}/v1/proxy/stats`);
    return res.json();
  }
}
