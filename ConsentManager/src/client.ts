import { ConsentRecord, DSARRequest, ConsentPolicy } from './types'

export class PisigmaConsentManager {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async record(userId: string, purpose: string, granted: boolean, ipAddress?: string): Promise<ConsentRecord> {
    const res = await fetch(`${this.baseUrl}/v1/consent/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, purpose, granted, ip_address: ipAddress })
    });
    return res.json() as Promise<ConsentRecord>;
  }

  async getConsent(userId: string): Promise<ConsentRecord[]> {
    const res = await fetch(`${this.baseUrl}/v1/consent/${userId}`);
    return res.json() as Promise<ConsentRecord[]>;
  }

  async submitDSAR(userId: string, type: string): Promise<{id: string, status: string}> {
    const res = await fetch(`${this.baseUrl}/v1/consent/dsar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, type })
    });
    return res.json() as Promise<{id: string, status: string}>;
  }

  async policies(): Promise<ConsentPolicy[]> {
    const res = await fetch(`${this.baseUrl}/v1/consent/policies`);
    return res.json() as Promise<ConsentPolicy[]>;
  }
}
