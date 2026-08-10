import { describe, it, expect } from 'vitest';
import app from '../src/index';

describe('CMS API', () => {
  it('should return health status', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.status).toBe('ok');
    expect(data.service).toBe('cms');
  });
  
  let contentId: string;
  
  it('should create content as draft', async () => {
    const res = await app.request('/v1/cms/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'test-post',
        title: 'Test Post',
        body: 'This is a test body',
      }),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.slug).toBe('test-post');
    expect(data.status).toBe('draft');
    expect(data.version).toBe(1);
    contentId = data.id;
  });
  
  it('should get content by slug', async () => {
    const res = await app.request('/v1/cms/content/test-post');
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.id).toBe(contentId);
    expect(data.slug).toBe('test-post');
  });
  
  it('should publish updates status', async () => {
    const res = await app.request(`/v1/cms/content/${contentId}/publish`, {
      method: 'PUT',
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.id).toBe(contentId);
    expect(data.status).toBe('published');
  });
  
  it('should get version history', async () => {
    const res = await app.request(`/v1/cms/content/${contentId}/versions`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0].content_id).toBe(contentId);
    expect(data[0].version).toBe(1);
  });
});
