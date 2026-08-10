import { QueueStats, QueueSubscriber } from './types';

export class PisigmaQueueBroker {
  constructor(private baseUrl: string, private apiKey?: string) {}

  private async fetch(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers || {});
    if (this.apiKey) headers.set('Authorization', `Bearer ${this.apiKey}`);
    headers.set('Content-Type', 'application/json');
    return fetch(`${this.baseUrl}${path}`, { ...options, headers });
  }

  async publish(queue: string, payload: any, delay_seconds?: number): Promise<any> {
    const res = await this.fetch('/v1/queue/publish', {
      method: 'POST',
      body: JSON.stringify({ queue, payload, delay_seconds })
    });
    return res.json() as any;
  }

  async subscribe(queue: string, webhook_url: string): Promise<any> {
    const res = await this.fetch('/v1/queue/subscribe', {
      method: 'POST',
      body: JSON.stringify({ queue, webhook_url })
    });
    return res.json() as any;
  }

  async stats(queue: string): Promise<QueueStats> {
    const res = await this.fetch(`/v1/queue/${queue}/stats`);
    return res.json() as any;
  }

  async retry(queue: string): Promise<any> {
    const res = await this.fetch(`/v1/queue/${queue}/retry`, {
      method: 'POST'
    });
    return res.json() as any;
  }
}