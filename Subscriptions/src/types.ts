export interface Plan {
  id: string;
  name: string;
  price_cents: number;
  interval: 'monthly' | 'yearly';
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: Plan;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}
