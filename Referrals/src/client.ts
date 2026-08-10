import { ReferralConversion, ReferralStats } from './types';

export class PisigmaReferrals {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8827') {
    this.baseUrl = baseUrl;
  }

  async generateCode(user_id: string): Promise<{ code: string, user_id: string }> {
    const res = await fetch(`${this.baseUrl}/v1/referrals/codes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    return res.json() as any;
  }

  async track(code: string, referred_id: string, commission_cents?: number): Promise<ReferralConversion> {
    const res = await fetch(`${this.baseUrl}/v1/referrals/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, referred_id, commission_cents })
    });
    return res.json() as any;
  }

  async stats(userId: string): Promise<ReferralStats> {
    const res = await fetch(`${this.baseUrl}/v1/referrals/${userId}/stats`);
    return res.json() as any;
  }

  async payouts(): Promise<Record<string, number>> {
    const res = await fetch(`${this.baseUrl}/v1/referrals/payouts`);
    return res.json() as any;
  }
}
