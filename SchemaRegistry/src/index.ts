import { Hono } from 'hono';
import { RegisteredSchema, SchemaField, SchemaVersion, ValidationResult, CompatibilityResult } from './types';

const app = new Hono<{ Bindings: {} }>();

const schemas = new Map<string, RegisteredSchema>();

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'schemaregistry', schemas_count: schemas.size });
});

app.post('/v1/schemas/register', async (c) => {
  const body = await c.req.json<{ name: string; namespace?: string; description?: string; fields: SchemaField[] }>();
  const now = new Date().toISOString();
  
  const existing = schemas.get(body.name);
  if (existing) {
    const newVersionNum = existing.current_version + 1;
    const newVersion: SchemaVersion = {
      version: newVersionNum,
      fields: body.fields,
      created_at: now
    };
    existing.versions.push(newVersion);
    existing.current_version = newVersionNum;
    existing.updated_at = now;
    schemas.set(body.name, existing);
    return c.json(existing);
  } else {
    const id = crypto.randomUUID();
    const newSchema: RegisteredSchema = {
      id,
      name: body.name,
      namespace: body.namespace,
      description: body.description,
      versions: [{ version: 1, fields: body.fields, created_at: now }],
      current_version: 1,
      created_at: now,
      updated_at: now
    };
    schemas.set(body.name, newSchema);
    return c.json(newSchema);
  }
});

app.post('/v1/schemas/validate', async (c) => {
  const body = await c.req.json<{ schema_name: string; version?: number; payload: Record<string, unknown> }>();
  const schema = schemas.get(body.schema_name);
  if (!schema) {
    return c.json({ valid: false, errors: ['Schema not found'], schema_name: body.schema_name, schema_version: 0 });
  }
  
  const targetVersion = body.version || schema.current_version;
  const sv = schema.versions.find((v) => v.version === targetVersion);
  if (!sv) {
    return c.json({ valid: false, errors: ['Schema version not found'], schema_name: body.schema_name, schema_version: targetVersion });
  }

  const errors: string[] = [];
  for (const field of sv.fields) {
    const val = body.payload[field.name];
    if (field.required && val === undefined) {
      errors.push(`Missing required field: ${field.name}`);
      continue;
    }
    if (val !== undefined) {
      if (field.type === 'array' && !Array.isArray(val)) {
        errors.push(`Field ${field.name} should be array`);
      } else if (field.type === 'null' && val !== null) {
        errors.push(`Field ${field.name} should be null`);
      } else if (field.type !== 'array' && field.type !== 'null') {
        const type = typeof val;
        if (type !== field.type) {
           errors.push(`Field ${field.name} type mismatch. Expected ${field.type}, got ${type}`);
        }
      }
    }
  }

  return c.json({ valid: errors.length === 0, errors, schema_name: body.schema_name, schema_version: targetVersion });
});

app.post('/v1/schemas/compatibility', async (c) => {
  const body = await c.req.json<{ schema_name: string; new_fields: SchemaField[]; mode?: 'backward' | 'forward' | 'full' }>();
  const schema = schemas.get(body.schema_name);
  const mode = body.mode || 'backward';

  if (!schema) {
    return c.json({ compatible: true, mode, errors: [] });
  }

  const latest = schema.versions.find((v) => v.version === schema.current_version)!;
  const errors: string[] = [];

  const oldFields = new Map(latest.fields.map(f => [f.name, f]));
  const newFieldsMap = new Map(body.new_fields.map(f => [f.name, f]));

  for (const old of latest.fields) {
    const newF = newFieldsMap.get(old.name);
    if (!newF) {
      if (old.required) {
        errors.push(`Removed required field: ${old.name}`);
      }
    } else {
      if (old.type !== newF.type) {
        errors.push(`Type changed for field: ${old.name}`);
      }
    }
  }

  for (const newF of body.new_fields) {
    if (!oldFields.has(newF.name) && newF.required && newF.default_value === undefined) {
      errors.push(`Added required field without default: ${newF.name}`);
    }
  }

  return c.json({ compatible: errors.length === 0, mode, errors });
});

app.get('/v1/schemas', (c) => {
  const list = Array.from(schemas.values()).map(s => ({
    name: s.name,
    namespace: s.namespace,
    current_version: s.current_version,
    field_count: s.versions.find(v => v.version === s.current_version)?.fields.length || 0
  }));
  return c.json({ schemas: list, total: list.length });
});

app.get('/v1/schemas/:name/versions', (c) => {
  const name = c.req.param('name');
  const schema = schemas.get(name);
  if (!schema) return c.json({ error: 'Not found' }, 404);
  return c.json({ name: schema.name, versions: schema.versions });
});

app.get('/v1/schemas/:name/latest', (c) => {
  const name = c.req.param('name');
  const schema = schemas.get(name);
  if (!schema) return c.json({ error: 'Not found' }, 404);
  const latest = schema.versions.find((v) => v.version === schema.current_version);
  return c.json({ name: schema.name, version: latest?.version, fields: latest?.fields });
});

app.get('/v1/schemas/:name/version/:version', (c) => {
  const name = c.req.param('name');
  const version = parseInt(c.req.param('version'), 10);
  const schema = schemas.get(name);
  if (!schema) return c.json({ error: 'Not found' }, 404);
  const v = schema.versions.find((vs) => vs.version === version);
  if (!v) return c.json({ error: 'Version not found' }, 404);
  return c.json(v);
});

export default app;
