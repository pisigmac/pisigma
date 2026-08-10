import { Hono } from 'hono';

const app = new Hono<{ Bindings: { API_KEY: string } }>();

const totpSecrets = new Map<string, string>();
const backupCodesStore = new Map<string, string[]>();

const generateRandomHex = (length: number) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

const generateBackupCodesList = () => {
  return Array.from({ length: 8 }, () => generateRandomHex(4));
};

app.get('/health', (c) => {
  const key = c.env?.API_KEY;
  return c.json({ status: 'ok', service: 'mfa' });
});

app.post('/v1/mfa/totp/setup', async (c) => {
  const { user_id } = await c.req.json();
  const secret = generateRandomHex(16);
  const uri = `otpauth://totp/PiSigma:${user_id}?secret=${secret}`;
  const backup_codes = generateBackupCodesList();
  
  totpSecrets.set(user_id, secret);
  backupCodesStore.set(user_id, [...backup_codes]);

  return c.json({ user_id, secret, uri, backup_codes });
});

app.post('/v1/mfa/totp/verify', async (c) => {
  const { user_id, code } = await c.req.json();
  const secret = totpSecrets.get(user_id);
  const valid = secret ? code === secret.substring(0, 6) : false;
  
  return c.json({ valid, user_id });
});

app.post('/v1/mfa/backup-codes/generate', async (c) => {
  const { user_id } = await c.req.json();
  const codes = generateBackupCodesList();
  backupCodesStore.set(user_id, [...codes]);
  
  return c.json({ user_id, codes });
});

app.post('/v1/mfa/backup-codes/verify', async (c) => {
  const { user_id, code } = await c.req.json();
  const codes = backupCodesStore.get(user_id) || [];
  
  const index = codes.indexOf(code);
  const valid = index !== -1;
  
  if (valid) {
    codes.splice(index, 1);
    backupCodesStore.set(user_id, codes);
  }
  
  return c.json({ valid });
});

export default app;
