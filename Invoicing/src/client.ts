import { Invoice } from './types';

export class PisigmaInvoicing {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8826') {
    this.baseUrl = baseUrl;
  }

  async create(customer_id: string, line_items: { description: string, quantity: number, unit_price_cents: number }[], currency?: string, tax_rate?: number): Promise<Invoice> {
    const res = await fetch(`${this.baseUrl}/v1/invoices/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id, line_items, currency, tax_rate })
    });
    return res.json() as any;
  }

  async get(id: string): Promise<Invoice> {
    const res = await fetch(`${this.baseUrl}/v1/invoices/${id}`);
    return res.json() as any;
  }

  async send(id: string): Promise<Invoice> {
    const res = await fetch(`${this.baseUrl}/v1/invoices/${id}/send`, {
      method: 'POST'
    });
    return res.json() as any;
  }

  async summary(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/v1/invoices/summary`);
    return res.json() as any;
  }
}
