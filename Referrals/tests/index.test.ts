import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('Referrals Service', () => {
  it('should return health status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', service: 'referrals' });
  });

  it('should generate a referral code', async () => {
    const req = new Request('http://localhost/v1/referrals/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user_1' })
    });
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.code).toBeDefined();
    expect(data.user_id).toBe('user_1');
  });

  it('should track a conversion', async () => {
    const codeReq = new Request('http://localhost/v1/referrals/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user_2' })
    });
    const codeRes = await app.fetch(codeReq);
    const { code } = (await codeRes.json()) as any;

    const trackReq = new Request('http://localhost/v1/referrals/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, referred_id: 'user_3', commission_cents: 500 })
    });
    const res = await app.fetch(trackReq);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.commission_cents).toBe(500);
  });

  it('should get stats for a user', async () => {
    const codeReq = new Request('http://localhost/v1/referrals/codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user_4' })
    });
    const codeRes = await app.fetch(codeReq);
    const { code } = (await codeRes.json()) as any;

    await app.fetch(new Request('http://localhost/v1/referrals/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, referred_id: 'user_5', commission_cents: 1000 })
    }));

    const res = await app.request('/v1/referrals/user_4/stats');
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.total_referrals).toBe(1);
    expect(data.total_conversions).toBe(1);
    expect(data.total_commission_cents).toBe(1000);
  });

  it('should return payouts', async () => {
    const res = await app.request('/v1/referrals/payouts');
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data['user_4']).toBeDefined();
  });
});
