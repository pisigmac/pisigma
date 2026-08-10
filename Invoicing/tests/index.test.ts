import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('Invoicing Service', () => {
  it('should return health status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok', service: 'invoicing' });
  });

  it('should create an invoice computing totals correctly', async () => {
    const req = new Request('http://localhost/v1/invoices/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: 'cust_1',
        line_items: [{ description: 'Item 1', quantity: 2, unit_price_cents: 1000 }],
        tax_rate: 0.1
      })
    });
    const res = await app.fetch(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.subtotal_cents).toBe(2000);
    expect(data.tax_cents).toBe(200);
    expect(data.total_cents).toBe(2200);
    expect(data.status).toBe('draft');
  });

  it('should get an invoice', async () => {
    const createReq = new Request('http://localhost/v1/invoices/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: 'cust_2',
        line_items: [{ description: 'Item A', quantity: 1, unit_price_cents: 500 }]
      })
    });
    const createRes = await app.fetch(createReq);
    const created = (await createRes.json()) as any;

    const res = await app.request(`/v1/invoices/${created.id}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.id).toBe(created.id);
  });

  it('should send an invoice', async () => {
    const createReq = new Request('http://localhost/v1/invoices/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: 'cust_3',
        line_items: [{ description: 'Item B', quantity: 1, unit_price_cents: 1500 }]
      })
    });
    const createRes = await app.fetch(createReq);
    const created = (await createRes.json()) as any;

    const sendReq = new Request(`http://localhost/v1/invoices/${created.id}/send`, { method: 'POST' });
    const res = await app.fetch(sendReq);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe('sent');
  });

  it('should return a summary', async () => {
    const res = await app.request('/v1/invoices/summary');
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.total_revenue_cents).toBeDefined();
    expect(data.outstanding_cents).toBeDefined();
    expect(data.count_by_status).toBeDefined();
  });
});
