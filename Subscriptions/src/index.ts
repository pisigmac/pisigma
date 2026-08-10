import { Hono } from 'hono';
import { Subscription, Plan } from './types';

const app = new Hono<{ Bindings: { API_KEY: string } }>();

const subscriptions = new Map<string, Subscription>();

app.get('/health', (c) => c.json({ status: 'ok', service: 'subscriptions' }));

app.post('/v1/subscriptions/create', async (c) => {
  const body = await c.req.json<{ user_id: string; plan: Plan; trial_days?: number }>();
  const id = `sub_${Date.now()}`;
  const now = new Date();
  
  let current_period_end = new Date();
  if (body.trial_days) {
    current_period_end.setDate(now.getDate() + body.trial_days);
  } else if (body.plan.interval === 'monthly') {
    current_period_end.setMonth(now.getMonth() + 1);
  } else {
    current_period_end.setFullYear(now.getFullYear() + 1);
  }

  const subscription: Subscription = {
    id,
    user_id: body.user_id,
    plan: body.plan,
    status: body.trial_days ? 'trialing' : 'active',
    current_period_start: now.toISOString(),
    current_period_end: current_period_end.toISOString(),
    created_at: now.toISOString(),
  };

  subscriptions.set(id, subscription);
  return c.json(subscription);
});

app.get('/v1/subscriptions/:id', (c) => {
  const id = c.req.param('id');
  const sub = subscriptions.get(id);
  if (!sub) return c.json({ error: 'Not found' }, 404);
  return c.json(sub);
});

app.post('/v1/subscriptions/:id/upgrade', async (c) => {
  const id = c.req.param('id');
  const sub = subscriptions.get(id);
  if (!sub) return c.json({ error: 'Not found' }, 404);

  const { new_plan } = await c.req.json<{ new_plan: Plan }>();
  sub.plan = new_plan;
  
  const now = new Date();
  sub.current_period_start = now.toISOString();
  let current_period_end = new Date();
  if (new_plan.interval === 'monthly') {
    current_period_end.setMonth(now.getMonth() + 1);
  } else {
    current_period_end.setFullYear(now.getFullYear() + 1);
  }
  sub.current_period_end = current_period_end.toISOString();
  
  subscriptions.set(id, sub);
  return c.json(sub);
});

app.post('/v1/subscriptions/:id/cancel', (c) => {
  const id = c.req.param('id');
  const sub = subscriptions.get(id);
  if (!sub) return c.json({ error: 'Not found' }, 404);

  sub.status = 'canceled';
  subscriptions.set(id, sub);
  return c.json(sub);
});

export default app;
