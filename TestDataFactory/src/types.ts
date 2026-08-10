export type FieldDefinition = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'uuid' | 'date' | 'name' | 'address' | 'phone' | 'company' | 'url' | 'ip' | 'paragraph';
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
};

export type SchemaDefinition = {
  name: string;
  fields: FieldDefinition[];
  id?: string;
  created_at?: string;
};

export type GenerateRequest = {
  schema_name?: string;
  fields?: FieldDefinition[];
  count: number;
  locale?: string;
  seed?: number;
};

export type RelatedRequest = {
  entities: Array<{
    schema_name: string;
    count: number;
    foreign_key?: string;
    parent?: string;
  }>;
};

export type GeneratedRecord = Record<string, unknown>;

export type ClientResult<T> = {
  data?: T;
  error?: string;
};
