import { SMSMessage, OTPRequest, OTPVerify } from './types';

export class PisigmaSMS {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8821') {
    this.baseUrl = baseUrl;
  }

  async send(to: string, body: string): Promise<{ id: string, to: string, status: string }> {
    const res = await fetch(`${this.baseUrl}/v1/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, body })
    });
    return res.json() as Promise<any>;
  }

  async generateOTP(req: OTPRequest): Promise<{ phone: string, purpose?: string, expires_in: number, sent: boolean }> {
    const res = await fetch(`${this.baseUrl}/v1/sms/otp/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    return res.json() as Promise<any>;
  }

  async verifyOTP(req: OTPVerify): Promise<{ valid: boolean }> {
    const res = await fetch(`${this.baseUrl}/v1/sms/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    return res.json() as Promise<{ valid: boolean }>;
  }

  async deliveryStatus(id: string): Promise<SMSMessage> {
    const res = await fetch(`${this.baseUrl}/v1/sms/delivery/${id}`);
    if (!res.ok) {
        throw new Error('Not found');
    }
    return res.json() as Promise<SMSMessage>;
  }
}
