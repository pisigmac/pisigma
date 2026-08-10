import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('Subscriptions Service', () => {
  it('should return health status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', service: 'subscriptions' });
  });

  it('should create a subscription', async () => {
    const req = new Request('http://localhost/v1/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'user_123',
        plan: { id: 'plan_1', name: 'Pro', price_cents: 1000, interval: 'monthly' }
      })
    });
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.user_id).toBe('user_123');
    expect(data.status).toBe('active');
    expect(data.id).toBeDefined();
  });

  it('should get a subscription', async () => {
    const createReq = new Request('http://localhost/v1/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'user_456',
        plan: { id: 'plan_2', name: 'Basic', price_cents: 500, interval: 'monthly' }
      })
    });
    const createRes = await app.fetch(createReq);
    const created = (await createRes.json()) as any;

    const res = await app.request(`/v1/subscriptions/${created.id}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.id).toBe(created.id);
  });

  it('should upgrade a subscription', async () => {
    const createReq = new Request('http://localhost/v1/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'user_789',
        plan: { id: 'plan_2', name: 'Basic', price_cents: 500, interval: 'monthly' }
      })
    });
    const createRes = await app.fetch(createReq);
    const created = (await createRes.json()) as any;

    const upgradeReq = new Request(`http://localhost/v1/subscriptions/${created.id}/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        new_plan: { id: 'plan_1', name: 'Pro', price_cents: 1000, interval: 'yearly' }
      })
    });
    const res = await app.fetch(upgradeReq);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.plan.name).toBe('Pro');
  });

  it('should cancel a subscription', async () => {
    const createReq = new Request('http://localhost/v1/subscriptions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'user_cancel',
        plan: { id: 'plan_1', name: 'Pro', price_cents: 1000, interval: 'monthly' }
      })
    });
    const createRes = await app.fetch(createReq);
    const created = (await createRes.json()) as any;

    const cancelReq = new Request(`http://localhost/v1/subscriptions/${created.id}/cancel`, {
      method: 'POST'
    });
    const res = await app.fetch(cancelReq);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe('canceled');
  });
});
