import { FormSchema, FormField, FormSubmission } from './types';

export class PisigmaFormBuilder {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async create(name: string, fields: FormField[]): Promise<FormSchema> {
    const res = await fetch(`${this.baseUrl}/v1/forms/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, fields }),
    });
    return res.json();
  }

  async get(id: string): Promise<FormSchema> {
    const res = await fetch(`${this.baseUrl}/v1/forms/${id}`);
    if (!res.ok) throw new Error('Not found');
    return res.json();
  }

  async submit(id: string, data: Record<string, any>): Promise<FormSubmission> {
    const res = await fetch(`${this.baseUrl}/v1/forms/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    if (!res.ok) throw new Error('Submit failed');
    return res.json();
  }

  async responses(id: string): Promise<FormSubmission[]> {
    const res = await fetch(`${this.baseUrl}/v1/forms/${id}/responses`);
    return res.json();
  }
}
