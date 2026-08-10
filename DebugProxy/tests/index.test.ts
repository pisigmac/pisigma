import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('DebugProxy', () => {
  it('Health check', async () => {
    const res = await app.request('/health');
    const data = await res.json() as any;
    expect(data.status).toBe('ok');
    expect(data.service).toBe('debugproxy');
  });

  it('Create intercept rule', async () => {
    await app.request('/v1/proxy/intercept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_service: 'api', target_service: 'auth' }),
    });

    const res = await app.request('/v1/proxy/rules');
    const data = await res.json() as any;
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].source_service).toBe('api');
  });

  it('Capture a request manually and filter by source_service', async () => {
    await app.request('/v1/proxy/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'GET',
        url: 'http://auth/users',
        response_status: 200,
        latency_ms: 50,
        source_service: 'front',
        target_service: 'auth'
      }),
    });

    const res = await app.request('/v1/proxy/requests');
    const data = await res.json() as any;
    expect(data.total).toBeGreaterThan(0);

    const filterRes = await app.request('/v1/proxy/requests?source=front');
    const filterData = await filterRes.json() as any;
    expect(filterData.total).toBe(1);
  });

  it('Stats calculation', async () => {
    // Adding more captured requests for stats
    await app.request('/v1/proxy/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'POST',
        url: 'http://auth/login',
        response_status: 400,
        latency_ms: 150,
        source_service: 'front',
        target_service: 'auth'
      }),
    });

    const res = await app.request('/v1/proxy/stats');
    const stats = await res.json() as any;
    expect(stats.total_captured).toBeGreaterThanOrEqual(2);
    expect(stats.error_rate).toBeGreaterThan(0);
    expect(stats.avg_latency_ms).toBeGreaterThan(0);
  });

  it('Clear requests', async () => {
    const res = await app.request('/v1/proxy/requests', { method: 'DELETE' });
    const data = await res.json() as any;
    expect(data.cleared).toBe(true);
    expect(data.count).toBeGreaterThan(0);

    const res2 = await app.request('/v1/proxy/requests');
    const data2 = await res2.json() as any;
    expect(data2.total).toBe(0);
  });

  it('Delete a rule', async () => {
    const createRes = await app.request('/v1/proxy/intercept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_service: 'test', target_service: 'test' }),
    });
    const { id } = await createRes.json() as any;

    const delRes = await app.request(`/v1/proxy/rules/${id}`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);

    const res2 = await app.request(`/v1/proxy/rules/${id}`, { method: 'DELETE' });
    expect(res2.status).toBe(404);
  });
});
