import { Hono } from 'hono';
import { WAFRule, WAFEvaluation, WAFResult } from './types';

const app = new Hono<{ Bindings: { API_KEY: string } }>();

const rulesStore: WAFRule[] = [];
let threatsCount: { [key: string]: number } = {
  ip_block: 0,
  geo_fence: 0,
  pattern: 0
};

app.get('/health', (c) => {
  const key = c.env?.API_KEY;
  return c.json({ status: 'ok', service: 'waf' });
});

app.post('/v1/waf/evaluate', async (c) => {
  const evalReq: WAFEvaluation = await c.req.json();
  
  for (const rule of rulesStore) {
    let matched = false;
    if (rule.type === 'ip_block' && evalReq.ip === rule.value) {
      matched = true;
    } else if (rule.type === 'geo_fence' && evalReq.country === rule.value) {
      matched = true;
    } else if (rule.type === 'pattern' && evalReq.path && new RegExp(rule.value).test(evalReq.path)) {
      matched = true;
    }
    
    if (matched) {
      if (rule.action === 'block') {
        threatsCount[rule.type] = (threatsCount[rule.type] || 0) + 1;
        return c.json({ allowed: false, matched_rule: rule, action: 'block' });
      }
      if (rule.action === 'allow') {
        return c.json({ allowed: true, matched_rule: rule, action: 'allow' });
      }
    }
  }
  
  return c.json({ allowed: true, action: 'allow' });
});

app.post('/v1/waf/rules', async (c) => {
  const { type, value, action } = await c.req.json();
  const id = `rule_${Date.now()}`;
  const rule: WAFRule = {
    id,
    type,
    value,
    action,
    created_at: new Date().toISOString()
  };
  rulesStore.push(rule);
  return c.json(rule);
});

app.get('/v1/waf/rules', (c) => {
  return c.json(rulesStore);
});

app.get('/v1/waf/threats', (c) => {
  return c.json(threatsCount);
});

export default app;
