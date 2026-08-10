import { Hono } from 'hono';
import { ReferralCode, ReferralConversion, ReferralStats } from './types';

const app = new Hono<{ Bindings: { API_KEY: string } }>();

const codes = new Map<string, ReferralCode>();
const conversions = new Map<string, ReferralConversion>();

app.get('/health', (c) => c.json({ status: 'ok', service: 'referrals' }));

app.post('/v1/referrals/codes', async (c) => {
  const { user_id } = await c.req.json<{ user_id: string }>();
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const referralCode: ReferralCode = {
    code,
    user_id,
    created_at: new Date().toISOString(),
    uses: 0
  };

  codes.set(code, referralCode);
  return c.json({ code, user_id });
});

app.post('/v1/referrals/track', async (c) => {
  const { code, referred_id, commission_cents } = await c.req.json<{ code: string; referred_id: string; commission_cents?: number }>();
  
  const refCode = codes.get(code);
  if (!refCode) return c.json({ error: 'Invalid code' }, 400);

  refCode.uses += 1;
  codes.set(code, refCode);

  const conversion: ReferralConversion = {
    id: `conv_${Date.now()}`,
    referrer_id: refCode.user_id,
    referred_id,
    code,
    converted_at: new Date().toISOString(),
    commission_cents
  };

  conversions.set(conversion.id, conversion);
  return c.json(conversion);
});

app.get('/v1/referrals/payouts', (c) => {
  const payouts = new Map<string, number>();

  for (const conv of conversions.values()) {
    if (conv.commission_cents) {
      const current = payouts.get(conv.referrer_id) || 0;
      payouts.set(conv.referrer_id, current + conv.commission_cents);
    }
  }

  return c.json(Object.fromEntries(payouts));
});

app.get('/v1/referrals/:userId/stats', (c) => {
  const userId = c.req.param('userId');
  
  let total_referrals = 0;
  let total_conversions = 0;
  let total_commission_cents = 0;

  for (const code of codes.values()) {
    if (code.user_id === userId) {
      total_referrals += code.uses;
    }
  }

  for (const conv of conversions.values()) {
    if (conv.referrer_id === userId) {
      total_conversions += 1;
      if (conv.commission_cents) {
        total_commission_cents += conv.commission_cents;
      }
    }
  }

  return c.json({
    total_referrals,
    total_conversions,
    total_commission_cents
  });
});

export default app;
