import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('MockServer', () => {
  it('Health check', async () => {
    const res = await app.request('/health');
    const data = await res.json() as any;
    expect(data.status).toBe('ok');
    expect(data.active_mocks).toBe(0);
  });

  it('Define a GET mock and hit it', async () => {
    await app.request('/v1/mocks/define', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'GET', path: '/api/users', response_body: [{ name: 'Alice' }] }),
    });

    const res = await app.request('/proxy/api/users');
    const data = await res.json() as any;
    expect(data).toEqual([{ name: 'Alice' }]);
  });

  it('Define a POST mock with status 201', async () => {
    await app.request('/v1/mocks/define', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'POST', path: '/api/posts', response_status: 201, response_body: {} }),
    });

    const res = await app.request('/proxy/api/posts', { method: 'POST' });
    expect(res.status).toBe(201);
  });

  it('Times = 1 works', async () => {
    await app.request('/v1/mocks/define', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'GET', path: '/api/once', times: 1, response_body: { success: true } }),
    });

    const res1 = await app.request('/proxy/api/once');
    expect(res1.status).toBe(200);

    const res2 = await app.request('/proxy/api/once');
    expect(res2.status).toBe(404);
  });

  it('Delete a mock', async () => {
    const createRes = await app.request('/v1/mocks/define', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'GET', path: '/api/del', response_body: {} }),
    });
    const { id } = await createRes.json() as any;

    const delRes = await app.request(`/v1/mocks/${id}`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);

    const res2 = await app.request('/proxy/api/del');
    expect(res2.status).toBe(404);
  });

  it('Check match log', async () => {
    const res = await app.request('/v1/mocks/log');
    const data = await res.json() as any;
    expect(data.matches.length).toBeGreaterThan(0);
  });
});
