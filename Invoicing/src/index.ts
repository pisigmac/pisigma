import { Hono } from 'hono';
import { Invoice, LineItem } from './types';

const app = new Hono<{ Bindings: { API_KEY: string } }>();

const invoices = new Map<string, Invoice>();

app.get('/health', (c) => c.json({ status: 'ok', service: 'invoicing' }));

app.get('/v1/invoices/summary', (c) => {
  let total_revenue = 0;
  let outstanding = 0;
  let count_draft = 0;
  let count_sent = 0;
  let count_paid = 0;

  for (const inv of invoices.values()) {
    if (inv.status === 'paid') total_revenue += inv.total_cents;
    if (inv.status === 'sent') outstanding += inv.total_cents;
    if (inv.status === 'draft') count_draft++;
    if (inv.status === 'sent') count_sent++;
    if (inv.status === 'paid') count_paid++;
  }

  return c.json({
    total_revenue_cents: total_revenue,
    outstanding_cents: outstanding,
    count_by_status: { draft: count_draft, sent: count_sent, paid: count_paid }
  });
});

app.post('/v1/invoices/create', async (c) => {
  const body = await c.req.json<{ customer_id: string; line_items: { description: string, quantity: number, unit_price_cents: number }[]; currency?: string; tax_rate?: number }>();
  
  const line_items: LineItem[] = body.line_items.map(item => ({
    ...item,
    total_cents: item.quantity * item.unit_price_cents
  }));

  const subtotal_cents = line_items.reduce((sum, item) => sum + item.total_cents, 0);
  const tax_rate = body.tax_rate ?? 0;
  const tax_cents = Math.round(subtotal_cents * tax_rate);
  const total_cents = subtotal_cents + tax_cents;

  const invoice: Invoice = {
    id: `inv_${Date.now()}`,
    customer_id: body.customer_id,
    line_items,
    subtotal_cents,
    tax_cents,
    total_cents,
    currency: body.currency ?? 'USD',
    status: 'draft',
    created_at: new Date().toISOString()
  };

  invoices.set(invoice.id, invoice);
  return c.json(invoice);
});

app.get('/v1/invoices/:id', (c) => {
  const id = c.req.param('id');
  const inv = invoices.get(id);
  if (!inv) return c.json({ error: 'Not found' }, 404);
  return c.json(inv);
});

app.post('/v1/invoices/:id/send', (c) => {
  const id = c.req.param('id');
  const inv = invoices.get(id);
  if (!inv) return c.json({ error: 'Not found' }, 404);
  
  inv.status = 'sent';
  invoices.set(id, inv);
  return c.json(inv);
});

export default app;
