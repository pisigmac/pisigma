import { Hono } from 'hono';

const app = new Hono<{ Bindings: { API_KEY: string } }>();

import { SMSMessage } from './types';

const messagesStore: SMSMessage[] = [];
const otpStore = new Map<string, { code: string, expires_at: number }>();

app.get('/health', (c) => {
  const key = c.env?.API_KEY;
  return c.json({ status: 'ok', service: 'sms' });
});

app.post('/v1/sms/send', async (c) => {
  const { to, body } = await c.req.json();
  
  if (!to.startsWith('+')) {
    return c.json({ error: 'Phone number must start with +' }, 400);
  }
  
  const id = `sms_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const message: SMSMessage = {
    id,
    to,
    body,
    status: 'queued',
    created_at: new Date().toISOString()
  };
  
  messagesStore.push(message);
  
  return c.json({ id, to, status: 'queued' });
});

app.post('/v1/sms/otp/generate', async (c) => {
  const { phone, purpose } = await c.req.json();
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = Date.now() + 5 * 60 * 1000;
  
  otpStore.set(phone, { code, expires_at });
  
  return c.json({ phone, purpose, expires_in: 300, sent: true });
});

app.post('/v1/sms/otp/verify', async (c) => {
  const { phone, code } = await c.req.json();
  
  const stored = otpStore.get(phone);
  
  if (!stored) {
    return c.json({ valid: false });
  }
  
  if (Date.now() > stored.expires_at) {
    otpStore.delete(phone);
    return c.json({ valid: false });
  }
  
  if (stored.code === code) {
    otpStore.delete(phone);
    return c.json({ valid: true });
  }
  
  return c.json({ valid: false });
});

app.get('/v1/sms/delivery/:id', (c) => {
  const id = c.req.param('id');
  const message = messagesStore.find(m => m.id === id);
  
  if (!message) {
    return c.json({ error: 'Not found' }, 404);
  }
  
  return c.json(message);
});

export default app;
