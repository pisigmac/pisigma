import { Subscription, Plan } from './types';

export class PisigmaSubscriptions {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8825') {
    this.baseUrl = baseUrl;
  }

  async create(user_id: string, plan: Plan, trial_days?: number): Promise<Subscription> {
    const res = await fetch(`${this.baseUrl}/v1/subscriptions/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, plan, trial_days })
    });
    return res.json() as any;
  }

  async get(id: string): Promise<Subscription> {
    const res = await fetch(`${this.baseUrl}/v1/subscriptions/${id}`);
    return res.json() as any;
  }

  async upgrade(id: string, new_plan: Plan): Promise<Subscription> {
    const res = await fetch(`${this.baseUrl}/v1/subscriptions/${id}/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_plan })
    });
    return res.json() as any;
  }

  async cancel(id: string): Promise<Subscription> {
    const res = await fetch(`${this.baseUrl}/v1/subscriptions/${id}/cancel`, {
      method: 'POST'
    });
    return res.json() as any;
  }
}
