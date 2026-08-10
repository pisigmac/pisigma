import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('SMS Service', () => {
  it('should return health status', async () => {
    const res = await app.request('/health');
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'sms' });
  });

  it('should validate phone format on send', async () => {
    const req = new Request('http://localhost/v1/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '1234567890', body: 'Hello' })
    });
    const res = await app.request(req);
    expect(res.status).toBe(400);
    
    const reqValid = new Request('http://localhost/v1/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '+1234567890', body: 'Hello' })
    });
    const resValid = await app.request(reqValid);
    const bodyValid = (await resValid.json()) as any;
    expect(resValid.status).toBe(200);
    expect(bodyValid.status).toBe('queued');
  });

  it('should generate and verify OTP', async () => {
    const genReq = new Request('http://localhost/v1/sms/otp/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+123' })
    });
    const genRes = await app.request(genReq);
    const genBody = (await genRes.json()) as any;
    expect(genBody.sent).toBe(true);

    // Hard to test the exact code since it's random and stored in memory without returning it
    // We can at least test invalid code
    const verifyReq = new Request('http://localhost/v1/sms/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+123', code: '000000' })
    });
    const verifyRes = await app.request(verifyReq);
    const verifyBody = (await verifyRes.json()) as any;
    expect(verifyBody.valid).toBe(false); // assuming '000000' is not the generated code
  });

  it('should return delivery status', async () => {
    const req = new Request('http://localhost/v1/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '+999', body: 'Hello' })
    });
    const res = await app.request(req);
    const body = (await res.json()) as any;
    
    const id = body.id;
    const getReq = new Request(`http://localhost/v1/sms/delivery/${id}`);
    const getRes = await app.request(getReq);
    const getBody = (await getRes.json()) as any;
    
    expect(getRes.status).toBe(200);
    expect(getBody.id).toBe(id);
    expect(getBody.status).toBe('queued');
  });
});
