import { Hono } from 'hono';
import { TestReport, TestResult, FlakyTest, TrendPoint } from './types';

const app = new Hono();
const reports: TestReport[] = [];

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'testreporter', reports_count: reports.length });
});

app.post('/v1/reports/ingest', async (c) => {
  const body = await c.req.json<{ service: string, results: TestResult[] }>();
  
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let duration_ms = 0;
  
  for (const r of body.results) {
    if (r.status === 'passed') passed++;
    else if (r.status === 'failed') failed++;
    else if (r.status === 'skipped') skipped++;
    duration_ms += r.duration_ms || 0;
  }
  
  const report: TestReport = {
    id: crypto.randomUUID(),
    service: body.service,
    results: body.results,
    total: body.results.length,
    passed,
    failed,
    skipped,
    duration_ms,
    ingested_at: new Date().toISOString()
  };
  
  reports.push(report);
  return c.json(report, 201);
});

app.get('/v1/reports/summary', (c) => {
  const services = new Set<string>();
  let total_tests = 0;
  let total_passed = 0;
  let total_failed = 0;
  let total_skipped = 0;
  const per_service: Record<string, { passed: number, failed: number, skipped: number, pass_rate: string }> = {};
  
  for (const r of reports) {
    services.add(r.service);
    total_tests += r.total;
    total_passed += r.passed;
    total_failed += r.failed;
    total_skipped += r.skipped;
    
    if (!per_service[r.service]) {
      per_service[r.service] = { passed: 0, failed: 0, skipped: 0, pass_rate: '0.0%' };
    }
    per_service[r.service].passed += r.passed;
    per_service[r.service].failed += r.failed;
    per_service[r.service].skipped += r.skipped;
  }
  
  for (const svc in per_service) {
    const s = per_service[svc];
    const total = s.passed + s.failed + s.skipped;
    s.pass_rate = total > 0 ? (s.passed / total * 100).toFixed(1) + '%' : '0.0%';
  }
  
  const overall_pass_rate = total_tests > 0 ? (total_passed / total_tests * 100).toFixed(1) + '%' : '0.0%';
  
  return c.json({
    total_services: services.size,
    total_tests,
    total_passed,
    total_failed,
    total_skipped,
    overall_pass_rate,
    per_service
  });
});

app.get('/v1/reports/flaky', (c) => {
  const testStats = new Map<string, { pass: number, fail: number, service: string, test_name: string }>();
  
  for (const report of reports) {
    for (const res of report.results) {
      const key = `${res.service}::${res.test_name}`;
      if (!testStats.has(key)) {
        testStats.set(key, { pass: 0, fail: 0, service: res.service, test_name: res.test_name });
      }
      const stat = testStats.get(key)!;
      if (res.status === 'passed') stat.pass++;
      if (res.status === 'failed') stat.fail++;
    }
  }
  
  const flaky_tests: FlakyTest[] = [];
  for (const stat of testStats.values()) {
    if (stat.pass > 0 && stat.fail > 0) {
      const total = stat.pass + stat.fail;
      flaky_tests.push({
        service: stat.service,
        test_name: stat.test_name,
        pass_count: stat.pass,
        fail_count: stat.fail,
        flaky_rate: stat.fail / total
      });
    }
  }
  
  flaky_tests.sort((a, b) => b.flaky_rate - a.flaky_rate);
  return c.json({ flaky_tests });
});

app.get('/v1/reports/trends', (c) => {
  const groups = new Map<string, { pass: number, total: number }>();
  
  for (const report of reports) {
    if (!report.ingested_at) continue;
    const date = report.ingested_at.split('T')[0];
    const key = `${report.service}::${date}`;
    if (!groups.has(key)) {
      groups.set(key, { pass: 0, total: 0 });
    }
    const g = groups.get(key)!;
    g.pass += report.passed;
    g.total += report.total;
  }
  
  const trends: TrendPoint[] = [];
  for (const [key, stats] of groups.entries()) {
    const [service, date] = key.split('::');
    trends.push({
      service,
      date,
      pass_rate: stats.total > 0 ? stats.pass / stats.total : 0,
      total: stats.total
    });
  }
  
  return c.json({ trends });
});

app.get('/v1/reports/coverage', (c) => {
  const svcStats = new Map<string, { tests: Set<string>, suites: Set<string> }>();
  for (const report of reports) {
    if (!svcStats.has(report.service)) {
      svcStats.set(report.service, { tests: new Set(), suites: new Set() });
    }
    const st = svcStats.get(report.service)!;
    for (const res of report.results) {
      st.tests.add(res.test_name);
      st.suites.add(res.suite);
    }
  }
  
  const coverage = Array.from(svcStats.entries()).map(([service, stats]) => ({
    service,
    test_count: stats.tests.size,
    suite_count: stats.suites.size
  }));
  
  return c.json({ coverage });
});

app.get('/v1/reports/:service', (c) => {
  const service = c.req.param('service');
  const matched = reports.filter(r => r.service === service);
  return c.json({ reports: matched });
});

export default app;
