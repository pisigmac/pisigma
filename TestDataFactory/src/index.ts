import { Hono } from 'hono';
import { SchemaDefinition, GenerateRequest, RelatedRequest, GeneratedRecord, FieldDefinition } from './types';

const app = new Hono<{ Bindings: { API_KEY?: string } }>();

const schemas = new Map<string, SchemaDefinition>();

// Seeded PRNG (very simple)
function seededRandom(seed: number) {
  let t = seed += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

const FIRST_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy', 'Kevin', 'Laura', 'Mallory', 'Ned', 'Olivia', 'Peggy', 'Quentin', 'Rupert', 'Sybil', 'Trent'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const STREETS = ['Main St', 'Oak St', 'Pine St', 'Maple Ave', 'Cedar Ln', 'Elm St', 'Washington St', 'Lake St', 'Hill St', 'Park Ave'];
const COMPANY_NAMES = ['Acme', 'Globex', 'Soylent', 'Initech', 'Umbrella', 'Massive Dynamic', 'Stark', 'Wayne', 'Cyberdyne', 'Tyrell'];
const COMPANY_SUFFIXES = ['Inc', 'LLC', 'Corp', 'Ltd', 'GmbH'];
const LOREM = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'];

function generateField(field: FieldDefinition, rnd: () => number): unknown {
  switch (field.type) {
    case 'string':
      const len = Math.floor(rnd() * 6) + 3;
      return Array.from({ length: len }, () => LOREM[Math.floor(rnd() * LOREM.length)]).join(' ');
    case 'number':
      const min = field.min ?? 1;
      const max = field.max ?? 1000;
      return Math.floor(rnd() * (max - min + 1)) + min;
    case 'boolean':
      return rnd() > 0.5;
    case 'email':
      const first = FIRST_NAMES[Math.floor(rnd() * FIRST_NAMES.length)].toLowerCase();
      const last = LAST_NAMES[Math.floor(rnd() * LAST_NAMES.length)].toLowerCase();
      return `${first}.${last}@example.com`;
    case 'uuid':
      // Very simple fake UUID for tests
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (rnd() * 16) | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    case 'date':
      const now = Date.now();
      const twoYearsAgo = now - 2 * 365 * 24 * 60 * 60 * 1000;
      const randomDate = new Date(twoYearsAgo + rnd() * (now - twoYearsAgo));
      return randomDate.toISOString();
    case 'name':
      return `${FIRST_NAMES[Math.floor(rnd() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rnd() * LAST_NAMES.length)]}`;
    case 'address':
      const num = Math.floor(rnd() * 9999) + 1;
      const street = STREETS[Math.floor(rnd() * STREETS.length)];
      const city = CITIES[Math.floor(rnd() * CITIES.length)];
      return `${num} ${street}, ${city}`;
    case 'phone':
      const p1 = Math.floor(rnd() * 900) + 100;
      const p2 = Math.floor(rnd() * 9000) + 1000;
      return `+1-555-${p1}-${p2}`;
    case 'company':
      const c = COMPANY_NAMES[Math.floor(rnd() * COMPANY_NAMES.length)];
      const s = COMPANY_SUFFIXES[Math.floor(rnd() * COMPANY_SUFFIXES.length)];
      return `${c} ${s}`;
    case 'url':
      const w = LOREM[Math.floor(rnd() * LOREM.length)];
      return `https://www.${w}.com`;
    case 'ip':
      return `${Math.floor(rnd() * 256)}.${Math.floor(rnd() * 256)}.${Math.floor(rnd() * 256)}.${Math.floor(rnd() * 256)}`;
    case 'paragraph':
      return Array.from({ length: 3 }, () => 
        Array.from({ length: 10 }, () => LOREM[Math.floor(rnd() * LOREM.length)]).join(' ') + '.'
      ).join(' ');
    default:
      return null;
  }
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'testdatafactory', timestamp: new Date().toISOString() });
});

app.post('/v1/generate', async (c) => {
  const req = await c.req.json<GenerateRequest>();
  
  let fieldsToUse: FieldDefinition[] = [];
  if (req.schema_name && schemas.has(req.schema_name)) {
    fieldsToUse = schemas.get(req.schema_name)!.fields;
  } else if (req.fields) {
    fieldsToUse = req.fields;
  } else {
    return c.json({ error: 'Must provide schema_name or fields' }, 400);
  }

  let rnd = Math.random;
  if (req.seed !== undefined) {
    let currentSeed = req.seed;
    rnd = () => {
      currentSeed = (currentSeed * 16807) % 2147483647;
      return (currentSeed - 1) / 2147483646;
    };
  }

  const data: GeneratedRecord[] = [];
  for (let i = 0; i < req.count; i++) {
    const record: GeneratedRecord = {};
    for (const field of fieldsToUse) {
      record[field.name] = generateField(field, rnd);
    }
    data.push(record);
  }

  return c.json({ data, count: req.count, schema_name: req.schema_name, seed: req.seed });
});

app.post('/v1/generate/related', async (c) => {
  const req = await c.req.json<RelatedRequest>();
  const rnd = Math.random;

  const result: Record<string, GeneratedRecord[]> = {};
  
  for (const entityReq of req.entities) {
    if (!schemas.has(entityReq.schema_name)) {
       return c.json({ error: `Schema ${entityReq.schema_name} not found` }, 404);
    }
    
    const schema = schemas.get(entityReq.schema_name)!;
    const records: GeneratedRecord[] = [];
    
    if (entityReq.parent && result[entityReq.parent] && entityReq.foreign_key) {
      const parents = result[entityReq.parent];
      // Distribute count among parents
      for(let i=0; i<entityReq.count; i++) {
          const parent = parents[i % parents.length];
          const record: GeneratedRecord = {};
          for (const field of schema.fields) {
            record[field.name] = generateField(field, rnd);
          }
          record[entityReq.foreign_key] = parent.id;
          records.push(record);
      }
    } else {
        for(let i=0; i<entityReq.count; i++) {
            const record: GeneratedRecord = {};
            for (const field of schema.fields) {
              record[field.name] = generateField(field, rnd);
            }
            records.push(record);
        }
    }
    
    result[entityReq.schema_name] = records;
  }
  
  return c.json({ data: result });
});

app.get('/v1/schemas', (c) => {
  return c.json({ schemas: Array.from(schemas.values()) });
});

app.post('/v1/schemas', async (c) => {
  const schema = await c.req.json<Omit<SchemaDefinition, 'id' | 'created_at'>>();
  const id = 'sch_' + Math.random().toString(36).substring(2, 9);
  const fullSchema: SchemaDefinition = {
    ...schema,
    id,
    created_at: new Date().toISOString()
  };
  schemas.set(schema.name, fullSchema);
  return c.json(fullSchema);
});

export default app;
