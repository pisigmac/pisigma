import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('WAF Service', () => {
  it('should return health status', async () => {
    const res = await app.request('/health');
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'waf' });
  });

  it('should create IP block rule', async () => {
    const req = new Request('http://localhost/v1/waf/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ip_block', value: '1.2.3.4', action: 'block' })
    });
    const res = await app.request(req);
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body.type).toBe('ip_block');
    expect(body.value).toBe('1.2.3.4');
  });

  it('should evaluate blocked IP', async () => {
    const req = new Request('http://localhost/v1/waf/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: '1.2.3.4' })
    });
    const res = await app.request(req);
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body.allowed).toBe(false);
    expect(body.action).toBe('block');
  });

  it('should evaluate allowed IP', async () => {
    const req = new Request('http://localhost/v1/waf/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: '5.6.7.8' })
    });
    const res = await app.request(req);
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body.allowed).toBe(true);
  });

  it('should list rules', async () => {
    const req = new Request('http://localhost/v1/waf/rules');
    const res = await app.request(req);
    const body = (await res.json()) as any;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('should return threats summary', async () => {
    const req = new Request('http://localhost/v1/waf/threats');
    const res = await app.request(req);
    const body = (await res.json()) as any;
    expect(body.ip_block).toBeGreaterThan(0);
  });
});
