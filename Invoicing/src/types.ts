export interface LineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

export interface Invoice {
  id: string;
  customer_id: string;
  line_items: LineItem[];
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid';
  created_at: string;
}
