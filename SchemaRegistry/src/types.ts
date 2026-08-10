export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
  required?: boolean;
  description?: string;
  default_value?: unknown;
}

export interface SchemaVersion {
  version: number;
  fields: SchemaField[];
  created_at: string;
  changelog?: string;
}

export interface RegisteredSchema {
  id?: string;
  name: string;
  namespace?: string;
  description?: string;
  versions: SchemaVersion[];
  current_version: number;
  created_at?: string;
  updated_at?: string;
}

export interface CompatibilityResult {
  compatible: boolean;
  mode: string;
  errors: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  schema_name: string;
  schema_version: number;
}
