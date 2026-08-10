export interface FormField {
  name: string;
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox';
  required?: boolean;
  options?: string[];
}

export interface FormSchema {
  id: string;
  name: string;
  fields: FormField[];
  created_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  data: Record<string, any>;
  submitted_at: string;
}
