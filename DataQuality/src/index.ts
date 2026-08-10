import { Hono } from 'hono';
import { QualityRule, QualityViolation, ValidationReport, DataProfile, QualityScore } from './types';

const app = new Hono<{ Bindings: { [key: string]: string } }>();

const rules = new Map<string, QualityRule[]>();
const reports: ValidationReport[] = [];

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'dataquality', datasets_with_rules: rules.size });
});

app.post('/v1/quality/rules', async (c) => {
  const body = await c.req.json<QualityRule>();
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  
  const newRule = { ...body, id, created_at };
  
  const datasetRules = rules.get(newRule.dataset) || [];
  datasetRules.push(newRule);
  rules.set(newRule.dataset, datasetRules);
  
  return c.json(newRule);
});

app.post('/v1/quality/validate', async (c) => {
  const body = await c.req.json<{ dataset: string; data: Record<string, unknown>[] }>();
  const datasetRules = rules.get(body.dataset) || [];
  const violations: QualityViolation[] = [];
  let totalChecks = 0;

  for (let rowIndex = 0; rowIndex < body.data.length; rowIndex++) {
    const row = body.data[rowIndex];
    
    // For unique check
    const sets = new Map<string, Set<unknown>>();
    if (rowIndex === 0) {
       for (const r of datasetRules) {
         if (r.rule_type === 'unique') {
           sets.set(r.field, new Set());
         }
       }
    }

    for (const rule of datasetRules) {
      totalChecks++;
      const val = row[rule.field];

      if (rule.rule_type === 'not_null') {
        if (val === null || val === undefined) {
          violations.push({
            rule_id: rule.id!,
            field: rule.field,
            rule_type: rule.rule_type,
            severity: rule.severity,
            row_index: rowIndex,
            actual_value: val,
            message: `Field ${rule.field} cannot be null`
          });
        }
      } else if (rule.rule_type === 'unique') {
        const uniqueSet = sets.get(rule.field);
        if (uniqueSet) {
           if (uniqueSet.has(val)) {
             violations.push({
                rule_id: rule.id!,
                field: rule.field,
                rule_type: rule.rule_type,
                severity: rule.severity,
                row_index: rowIndex,
                actual_value: val,
                message: `Field ${rule.field} must be unique`
             });
           } else {
             uniqueSet.add(val);
           }
        } else {
          // If this is subsequent rows, we check across all data for unique rule
          const allVals = body.data.map(r => r[rule.field]);
          const isUnique = allVals.filter(v => v === val).length === 1;
          if (!isUnique) {
             violations.push({
                rule_id: rule.id!,
                field: rule.field,
                rule_type: rule.rule_type,
                severity: rule.severity,
                row_index: rowIndex,
                actual_value: val,
                message: `Field ${rule.field} must be unique`
             });
          }
        }
      } else if (rule.rule_type === 'range') {
        const num = Number(val);
        if (isNaN(num)) {
           violations.push({ rule_id: rule.id!, field: rule.field, rule_type: rule.rule_type, severity: rule.severity, row_index: rowIndex, actual_value: val, message: `Field ${rule.field} is not a number` });
        } else if ((rule.params?.min !== undefined && num < rule.params.min) || (rule.params?.max !== undefined && num > rule.params.max)) {
           violations.push({ rule_id: rule.id!, field: rule.field, rule_type: rule.rule_type, severity: rule.severity, row_index: rowIndex, actual_value: val, message: `Field ${rule.field} out of range` });
        }
      } else if (rule.rule_type === 'regex') {
        if (rule.params?.pattern) {
          const regex = new RegExp(rule.params.pattern);
          if (!regex.test(String(val))) {
             violations.push({ rule_id: rule.id!, field: rule.field, rule_type: rule.rule_type, severity: rule.severity, row_index: rowIndex, actual_value: val, message: `Field ${rule.field} does not match pattern` });
          }
        }
      } else if (rule.rule_type === 'enum') {
        if (rule.params?.allowed && !rule.params.allowed.includes(val)) {
           violations.push({ rule_id: rule.id!, field: rule.field, rule_type: rule.rule_type, severity: rule.severity, row_index: rowIndex, actual_value: val, message: `Field ${rule.field} not in allowed enum` });
        }
      } else if (rule.rule_type === 'type_check') {
        if (rule.params?.expected_type && typeof val !== rule.params.expected_type) {
           violations.push({ rule_id: rule.id!, field: rule.field, rule_type: rule.rule_type, severity: rule.severity, row_index: rowIndex, actual_value: val, message: `Field ${rule.field} expected type ${rule.params.expected_type}` });
        }
      }
    }
  }

  // A more robust unique check for all rows
  for (const rule of datasetRules) {
     if (rule.rule_type === 'unique') {
        const seen = new Set();
        for (let rowIndex = 0; rowIndex < body.data.length; rowIndex++) {
           const val = body.data[rowIndex][rule.field];
           if (seen.has(val)) {
             if (!violations.some(v => v.rule_id === rule.id && v.row_index === rowIndex)) {
                violations.push({ rule_id: rule.id!, field: rule.field, rule_type: rule.rule_type, severity: rule.severity, row_index: rowIndex, actual_value: val, message: `Field ${rule.field} must be unique` });
             }
           } else {
             seen.add(val);
           }
        }
     }
  }

  const violationCount = violations.length;
  const passRate = totalChecks === 0 ? 100 : ((totalChecks - violationCount) / totalChecks) * 100;
  
  const report: ValidationReport = {
    id: crypto.randomUUID(),
    dataset: body.dataset,
    total_rows: body.data.length,
    violations,
    violation_count: violationCount,
    pass_rate: passRate,
    validated_at: new Date().toISOString()
  };
  
  reports.push(report);
  
  return c.json(report);
});

app.post('/v1/quality/profile', async (c) => {
  const body = await c.req.json<{ dataset: string; data: Record<string, unknown>[] }>();
  const profiles: DataProfile[] = [];
  
  const fields = new Set<string>();
  body.data.forEach(row => {
    Object.keys(row).forEach(k => fields.add(k));
  });

  const total = body.data.length;

  for (const field of fields) {
    const values = body.data.map(r => r[field]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined);
    const nonNullCount = nonNullValues.length;
    const nullCount = total - nonNullCount;
    const uniqueCount = new Set(values).size;

    const profile: DataProfile = {
      dataset: body.dataset,
      field,
      total,
      non_null: nonNullCount,
      null_count: nullCount,
      unique_count: uniqueCount
    };

    const isNumeric = nonNullValues.every(v => typeof v === 'number');
    if (isNumeric && nonNullCount > 0) {
      const nums = nonNullValues as number[];
      profile.min = Math.min(...nums);
      profile.max = Math.max(...nums);
      profile.mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    }

    const counts = new Map<unknown, number>();
    for (const v of values) {
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    const mostCommon = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => ({ value: entry[0], count: entry[1] }));
    
    profile.most_common = mostCommon;

    profiles.push(profile);
  }

  return c.json({ profiles });
});

app.get('/v1/quality/scores', (c) => {
  const scores: QualityScore[] = [];
  const latestReports = new Map<string, ValidationReport>();

  for (const r of reports) {
    const existing = latestReports.get(r.dataset);
    if (!existing || new Date(r.validated_at) > new Date(existing.validated_at)) {
      latestReports.set(r.dataset, r);
    }
  }

  for (const [dataset, report] of latestReports.entries()) {
    // Determine total checks from rules length * total rows
    const dr = rules.get(dataset) || [];
    const totalChecks = dr.length * report.total_rows;
    
    scores.push({
      dataset,
      score: report.pass_rate,
      total_checks: totalChecks,
      passed_checks: totalChecks - report.violation_count,
      last_validated: report.validated_at
    });
  }

  return c.json({ scores });
});

app.get('/v1/quality/reports', (c) => {
  const dataset = c.req.query('dataset');
  let filtered = reports;
  if (dataset) {
    filtered = reports.filter(r => r.dataset === dataset);
  }
  return c.json({ reports: filtered, total: filtered.length });
});

app.get('/v1/quality/rules', (c) => {
  const dataset = c.req.query('dataset');
  let allRules: QualityRule[] = [];
  if (dataset) {
    allRules = rules.get(dataset) || [];
  } else {
    for (const dr of rules.values()) {
      allRules.push(...dr);
    }
  }
  return c.json({ rules: allRules, total: allRules.length });
});

export default app;
