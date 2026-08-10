export interface FieldContract {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  nullable?: boolean;
  enum?: unknown[];
  nested?: FieldContract[];
}

export interface APIContract {
  id?: string;
  provider: string;
  consumer: string;
  endpoint: string;
  method: string;
  request_schema?: FieldContract[];
  response_schema: FieldContract[];
  version?: string;
  created_at?: string;
  status?: 'active' | 'deprecated';
}

export interface VerifyResult {
  contract_id: string;
  provider: string;
  consumer: string;
  passed: boolean;
  errors: string[];
  verified_at: string;
}

export interface DiffResult {
  breaking_changes: string[];
  non_breaking_changes: string[];
  compatible: boolean;
}
