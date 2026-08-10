import { TOTPSetup, TOTPVerifyResult, BackupCodes } from './types';

export class PisigmaMFA {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8823') {
    this.baseUrl = baseUrl;
  }

  async setupTOTP(user_id: string): Promise<TOTPSetup> {
    const res = await fetch(`${this.baseUrl}/v1/mfa/totp/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    return res.json() as Promise<TOTPSetup>;
  }

  async verifyTOTP(user_id: string, code: string): Promise<TOTPVerifyResult> {
    const res = await fetch(`${this.baseUrl}/v1/mfa/totp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, code })
    });
    return res.json() as Promise<TOTPVerifyResult>;
  }

  async generateBackupCodes(user_id: string): Promise<BackupCodes> {
    const res = await fetch(`${this.baseUrl}/v1/mfa/backup-codes/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id })
    });
    return res.json() as Promise<BackupCodes>;
  }

  async verifyBackupCode(user_id: string, code: string): Promise<{ valid: boolean }> {
    const res = await fetch(`${this.baseUrl}/v1/mfa/backup-codes/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, code })
    });
    return res.json() as Promise<{ valid: boolean }>;
  }
}
