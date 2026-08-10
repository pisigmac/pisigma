export interface SMSMessage {
  id: string;
  to: string;
  body: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  created_at: string;
}

export interface OTPRequest {
  phone: string;
  purpose?: string;
}

export interface OTPVerify {
  phone: string;
  code: string;
}
