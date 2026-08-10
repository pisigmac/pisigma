import { Hono } from 'hono';
import { APIContract, FieldContract, VerifyResult, DiffResult } from './types';

const app = new Hono();
const contracts = new Map<string, APIContract>();

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'contracttester', contracts_count: contracts.size });
});

app.post('/v1/contracts/register', async (c) => {
  const body = await c.req.json<APIContract>();
  if (!body.provider || !body.consumer) {
    return c.json({ error: 'provider and consumer are required' }, 400);
  }
  
  const contract: APIContract = {
    ...body,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    status: 'active'
  };
  
  contracts.set(contract.id!, contract);
  return c.json(contract, 201);
});

app.get('/v1/contracts', (c) => {
  const provider = c.req.query('provider');
  const consumer = c.req.query('consumer');
  
  let result = Array.from(contracts.values());
  if (provider) result = result.filter(r => r.provider === provider);
  if (consumer) result = result.filter(r => r.consumer === consumer);
  
  return c.json({ contracts: result, total: result.length });
});

app.post('/v1/contracts/verify', async (c) => {
  const body = await c.req.json<{ contract_id: string, actual_response: Record<string, unknown> }>();
  const contract = contracts.get(body.contract_id);
  
  if (!contract) return c.json({ error: 'Contract not found' }, 404);
  
  const errors: string[] = [];
  
  for (const field of contract.response_schema) {
    const value = body.actual_response[field.name];
    const exists = field.name in body.actual_response;
    
    if (field.required && !exists) {
      errors.push(`Required field '${field.name}' is missing`);
      continue;
    }
    
    if (exists) {
      if (value === null) {
        if (!field.nullable) {
          errors.push(`Field '${field.name}' cannot be null`);
        }
        continue;
      }
      
      const typeStr = field.type === 'array' ? (Array.isArray(value) ? 'array' : typeof value) : typeof value;
      if (typeStr !== field.type) {
         errors.push(`Field '${field.name}' expected type '${field.type}' but got '${typeStr}'`);
      }
      
      if (field.enum && !field.enum.includes(value as never)) {
        errors.push(`Field '${field.name}' value not in enum`);
      }
    }
  }
  
  const result: VerifyResult = {
    contract_id: contract.id!,
    provider: contract.provider,
    consumer: contract.consumer,
    passed: errors.length === 0,
    errors,
    verified_at: new Date().toISOString()
  };
  
  return c.json(result);
});

app.get('/v1/contracts/breaking', (c) => {
  const result = Array.from(contracts.values()).filter(r => r.status === 'deprecated');
  return c.json({ contracts: result });
});

app.post('/v1/contracts/diff', async (c) => {
  const { old_schema, new_schema } = await c.req.json<{ old_schema: FieldContract[], new_schema: FieldContract[] }>();
  
  const breaking_changes: string[] = [];
  const non_breaking_changes: string[] = [];
  
  const oldMap = new Map(old_schema.map(f => [f.name, f]));
  const newMap = new Map(new_schema.map(f => [f.name, f]));
  
  for (const oldField of old_schema) {
    if (!newMap.has(oldField.name)) {
      breaking_changes.push(`Field '${oldField.name}' was removed`);
    } else {
      const newField = newMap.get(oldField.name)!;
      if (oldField.type !== newField.type) {
        breaking_changes.push(`Field '${oldField.name}' type changed from '${oldField.type}' to '${newField.type}'`);
      }
    }
  }
  
  for (const newField of new_schema) {
    if (!oldMap.has(newField.name)) {
      if (newField.required) {
        breaking_changes.push(`Required field '${newField.name}' was added`);
      } else {
        non_breaking_changes.push(`Optional field '${newField.name}' was added`);
      }
    } else {
      const oldField = oldMap.get(newField.name)!;
      if (!oldField.nullable && newField.nullable) {
        non_breaking_changes.push(`Field '${newField.name}' was made nullable`);
      }
    }
  }
  
  const result: DiffResult = {
    breaking_changes,
    non_breaking_changes,
    compatible: breaking_changes.length === 0
  };
  
  return c.json(result);
});

app.delete('/v1/contracts/:id', (c) => {
  const id = c.req.param('id');
  if (contracts.has(id)) {
    contracts.delete(id);
    return c.json({ success: true });
  }
  return c.json({ error: 'Not found' }, 404);
});

export default app;
