import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('ServiceRegistry API', () => {
  it('should return health check', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.status).toBe('ok');
    expect(body.service).toBe('serviceregistry');
    expect(typeof body.registered_count).toBe('number');
  });

  it('should register a service and list it', async () => {
    const regRes = await app.request('/v1/services/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'auth-service',
        port: 8080,
        version: '1.0.0',
        health_url: 'http://localhost:8080/health'
      })
    });
    expect(regRes.status).toBe(200);
    const regBody = await regRes.json() as any;
    expect(regBody.name).toBe('auth-service');
    expect(regBody.status).toBe('unknown');

    const listRes = await app.request('/v1/services');
    const listBody = await listRes.json() as any;
    expect(listBody.total).toBeGreaterThan(0);
    expect(listBody.services[0].name).toBe('auth-service');
    // Because the health check will fail (no actual server running at localhost:8080)
    expect(listBody.services[0].status).toBe('unhealthy');
  });

  it('should get a specific service', async () => {
    const res = await app.request('/v1/services/auth-service');
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.name).toBe('auth-service');
    expect(body.status).toBeDefined();
  });

  it('should add dependencies and get topology', async () => {
    // Register another service
    await app.request('/v1/services/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'billing-service',
        port: 8081,
        version: '1.0.0'
      })
    });

    const depRes = await app.request('/v1/services/dependencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'billing-service',
        to: 'auth-service',
        type: 'http'
      })
    });
    expect(depRes.status).toBe(200);

    const topRes = await app.request('/v1/services/topology');
    const topBody = await topRes.json() as any;
    expect(topBody.services.length).toBeGreaterThanOrEqual(2);
    expect(topBody.dependencies).toHaveLength(1);
    expect(topBody.edges).toBe(1);
  });

  it('should delete a service', async () => {
    const delRes = await app.request('/v1/services/auth-service', { method: 'DELETE' });
    expect(delRes.status).toBe(200);
    const delBody = await delRes.json() as any;
    expect(delBody.deleted).toBe(true);

    const getRes = await app.request('/v1/services/auth-service');
    expect(getRes.status).toBe(404);
  });
});
