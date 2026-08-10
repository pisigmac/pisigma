import { RetentionPolicy, RetentionExecution, ErasureRequest } from './types'

export class PisigmaDataRetention {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async createPolicy(dataType: string, retentionDays: number, action: 'archive' | 'delete'): Promise<RetentionPolicy> {
    const res = await fetch(`${this.baseUrl}/v1/retention/policies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data_type: dataType, retention_days: retentionDays, action })
    });
    return res.json() as Promise<RetentionPolicy>;
  }

  async listPolicies(): Promise<RetentionPolicy[]> {
    const res = await fetch(`${this.baseUrl}/v1/retention/policies`);
    return res.json() as Promise<RetentionPolicy[]>;
  }

  async execute(policyId: string): Promise<{id: string, records_affected: number, executed_at: string}> {
    const res = await fetch(`${this.baseUrl}/v1/retention/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy_id: policyId })
    });
    return res.json() as Promise<{id: string, records_affected: number, executed_at: string}>;
  }

  async requestErasure(userId: string): Promise<{id: string, user_id: string, status: string}> {
    const res = await fetch(`${this.baseUrl}/v1/retention/erasure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
    return res.json() as Promise<{id: string, user_id: string, status: string}>;
  }

  async getErasure(id: string): Promise<ErasureRequest> {
    const res = await fetch(`${this.baseUrl}/v1/retention/erasure/${id}`);
    if (!res.ok) throw new Error('Not found');
    return res.json() as Promise<ErasureRequest>;
  }
}
