import { Hono } from 'hono';
import { FormSchema, FormField, FormSubmission } from './types';

const app = new Hono<{ Bindings: { API_KEY: string } }>();

const forms = new Map<string, FormSchema>();
const submissions: FormSubmission[] = [];

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'formbuilder' });
});

app.post('/v1/forms/create', async (c) => {
  const body = await c.req.json<{ name: string; fields: FormField[] }>();
  const id = Math.random().toString(36).substring(7);
  const schema: FormSchema = {
    id,
    name: body.name,
    fields: body.fields,
    created_at: new Date().toISOString(),
  };
  forms.set(id, schema);
  return c.json(schema);
});

app.get('/v1/forms/:id', (c) => {
  const id = c.req.param('id');
  const schema = forms.get(id);
  if (!schema) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(schema);
});

app.post('/v1/forms/:id/submit', async (c) => {
  const id = c.req.param('id');
  const schema = forms.get(id);
  if (!schema) {
    return c.json({ error: 'Form not found' }, 404);
  }

  const { data } = await c.req.json<{ data: Record<string, any> }>();
  
  // Validate required fields
  for (const field of schema.fields) {
    if (field.required && (data[field.name] === undefined || data[field.name] === null || data[field.name] === '')) {
      return c.json({ error: `Field ${field.name} is required` }, 400);
    }
  }

  const submissionId = Math.random().toString(36).substring(7);
  const submission: FormSubmission = {
    id: submissionId,
    form_id: id,
    data,
    submitted_at: new Date().toISOString(),
  };
  submissions.push(submission);
  return c.json(submission);
});

app.get('/v1/forms/:id/responses', (c) => {
  const id = c.req.param('id');
  const formSubmissions = submissions.filter(s => s.form_id === id);
  return c.json(formSubmissions);
});

export default app;
