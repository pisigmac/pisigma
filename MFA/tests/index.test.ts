import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('MFA Service', () => {
  it('should return health status', async () => {
    const res = await app.request('/health');
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok', service: 'mfa' });
  });

  it('should setup TOTP and return secret and URI', async () => {
    const req = new Request('http://localhost/v1/mfa/totp/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user1' })
    });
    const res = await app.request(req);
    const body = (await res.json()) as any;
    expect(res.status).toBe(200);
    expect(body.user_id).toBe('user1');
    expect(body.secret).toBeDefined();
    expect(body.uri).toMatch(/^otpauth:\/\/totp\/PiSigma:user1\?secret=/);
    expect(body.backup_codes).toHaveLength(8);
  });

  it('should verify TOTP code', async () => {
    const setupReq = new Request('http://localhost/v1/mfa/totp/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user2' })
    });
    const setupRes = await app.request(setupReq);
    const setupBody = (await setupRes.json()) as any;
    const code = setupBody.secret.substring(0, 6);

    const verifyReq = new Request('http://localhost/v1/mfa/totp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user2', code })
    });
    const verifyRes = await app.request(verifyReq);
    const verifyBody = (await verifyRes.json()) as any;
    expect(verifyBody.valid).toBe(true);
    expect(verifyBody.user_id).toBe('user2');
  });

  it('should generate and verify backup codes, consuming the code after use', async () => {
    const genReq = new Request('http://localhost/v1/mfa/backup-codes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user3' })
    });
    const genRes = await app.request(genReq);
    const genBody = (await genRes.json()) as any;
    expect(genBody.codes).toHaveLength(8);

    const codeToUse = genBody.codes[0];

    const verifyReq = new Request('http://localhost/v1/mfa/backup-codes/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user3', code: codeToUse })
    });
    const verifyRes = await app.request(verifyReq);
    const verifyBody = (await verifyRes.json()) as any;
    expect(verifyBody.valid).toBe(true);

    const verifyAgainReq = new Request('http://localhost/v1/mfa/backup-codes/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'user3', code: codeToUse })
    });
    const verifyAgainRes = await app.request(verifyAgainReq);
    const verifyAgainBody = (await verifyAgainRes.json()) as any;
    expect(verifyAgainBody.valid).toBe(false);
  });
});
