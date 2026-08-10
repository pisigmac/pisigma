import { expect, test, describe } from 'vitest';
import app from '../src/index';

describe('FormBuilder API', () => {
  test('health check', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('ok');
    expect(body.service).toBe('formbuilder');
  });

  test('create form, get form, submit response, list responses', async () => {
    // Create form
    const createReq = new Request('http://localhost/v1/forms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Contact Form',
        fields: [
          { name: 'name', type: 'text', required: true },
          { name: 'email', type: 'email', required: false },
        ]
      })
    });
    const createRes = await app.request(createReq);
    expect(createRes.status).toBe(200);
    const form = (await createRes.json()) as any;
    expect(form.name).toBe('Contact Form');
    expect(form.id).toBeDefined();

    // Get form
    const getRes = await app.request(`http://localhost/v1/forms/${form.id}`);
    expect(getRes.status).toBe(200);
    const fetchedForm = (await getRes.json()) as any;
    expect(fetchedForm.id).toBe(form.id);

    // Submit valid response
    const submitReq = new Request(`http://localhost/v1/forms/${form.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: { name: 'John Doe', email: 'john@example.com' }
      })
    });
    const submitRes = await app.request(submitReq);
    expect(submitRes.status).toBe(200);
    const submission = (await submitRes.json()) as any;
    expect(submission.data.name).toBe('John Doe');

    // Submit missing required field
    const submitMissingReq = new Request(`http://localhost/v1/forms/${form.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: { email: 'test@example.com' }
      })
    });
    const submitMissingRes = await app.request(submitMissingReq);
    expect(submitMissingRes.status).toBe(400);

    // List responses
    const listRes = await app.request(`http://localhost/v1/forms/${form.id}/responses`);
    expect(listRes.status).toBe(200);
    const responses = (await listRes.json()) as any;
    expect(responses.length).toBe(1);
    expect(responses[0].id).toBe(submission.id);
  });
});
