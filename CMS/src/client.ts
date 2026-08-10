import { Content, ContentVersion } from './types';

export class PisigmaCMS {
  constructor(private baseUrl: string, private apiKey?: string) {}
  
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers);
    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }
    
    const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }
  
  async create(data: { slug: string; title: string; body: string }): Promise<Content> {
    return this.request<Content>('/v1/cms/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }
  
  async getBySlug(slug: string): Promise<Content> {
    return this.request<Content>(`/v1/cms/content/${slug}`);
  }
  
  async publish(id: string): Promise<Content> {
    return this.request<Content>(`/v1/cms/content/${id}/publish`, {
      method: 'PUT',
    });
  }
  
  async versions(id: string): Promise<ContentVersion[]> {
    return this.request<ContentVersion[]>(`/v1/cms/content/${id}/versions`);
  }
}
