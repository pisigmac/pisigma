import { Hono } from 'hono';
import { EvalSuite, EvalRun, EvalScorer, EvalRunResult } from './types';

const app = new Hono();
const suites = new Map<string, EvalSuite>();
const runs: EvalRun[] = [];

function scoreExactMatch(expected: string, actual: string): number {
  return expected.trim().toLowerCase() === actual.trim().toLowerCase() ? 1.0 : 0.0
}
function scoreContains(expected: string, actual: string): number {
  return actual.toLowerCase().includes(expected.toLowerCase()) ? 1.0 : 0.0
}
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= a.length; i++) { matrix[i] = [i] }
  for (let j = 0; j <= b.length; j++) { matrix[0][j] = j }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1
      matrix[i][j] = Math.min(matrix[i-1][j]+1, matrix[i][j-1]+1, matrix[i-1][j-1]+cost)
    }
  }
  return matrix[a.length][b.length]
}
function scoreLevenshtein(expected: string, actual: string): number {
  const maxLen = Math.max(expected.length, actual.length)
  if (maxLen === 0) return 1.0
  return 1 - levenshteinDistance(expected, actual) / maxLen
}
function scoreLengthRatio(expected: string, actual: string): number {
  if (expected.length === 0 && actual.length === 0) return 1.0
  const shorter = Math.min(expected.length, actual.length)
  const longer = Math.max(expected.length, actual.length)
  return longer === 0 ? 1.0 : shorter / longer
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'evalrunner', suites_count: suites.size, runs_count: runs.length });
});

app.post('/v1/evals/suites', async (c) => {
  const body = await c.req.json();
  const { name, description, test_cases } = body;
  if (!test_cases || test_cases.length === 0) {
    return c.json({ error: 'test_cases must be non-empty' }, 400);
  }
  const id = crypto.randomUUID();
  const suite: EvalSuite = {
    id,
    name,
    description,
    test_cases,
    created_at: new Date().toISOString()
  };
  suites.set(id, suite);
  return c.json(suite);
});

app.get('/v1/evals/suites', (c) => {
  const result = Array.from(suites.values()).map(s => ({
    id: s.id,
    name: s.name,
    test_cases_count: s.test_cases.length
  }));
  return c.json(result);
});

app.post('/v1/evals/run', async (c) => {
  const { suite_id, responses, scorer = 'exact_match' } = await c.req.json();
  const suite = suites.get(suite_id);
  if (!suite) return c.json({ error: 'Suite not found' }, 404);
  
  let scoreFn;
  switch (scorer as EvalScorer) {
    case 'contains': scoreFn = scoreContains; break;
    case 'levenshtein': scoreFn = scoreLevenshtein; break;
    case 'length_ratio': scoreFn = scoreLengthRatio; break;
    case 'exact_match':
    default: scoreFn = scoreExactMatch; break;
  }
  
  const results: EvalRunResult[] = [];
  let passedCount = 0;
  let sumScore = 0;
  
  for (let i = 0; i < suite.test_cases.length; i++) {
    const tc = suite.test_cases[i];
    const actual = (responses && responses[i]) || '';
    const score = scoreFn(tc.expected_output, actual);
    const passed = score >= 0.5; // threshold
    if (passed) passedCount++;
    sumScore += score;
    
    results.push({
      test_case_index: i,
      input: tc.input,
      expected: tc.expected_output,
      actual,
      score,
      passed,
      scorer
    });
  }
  
  const run: EvalRun = {
    id: crypto.randomUUID(),
    suite_id,
    suite_name: suite.name,
    scorer,
    results,
    total: suite.test_cases.length,
    passed: passedCount,
    failed: suite.test_cases.length - passedCount,
    avg_score: sumScore / suite.test_cases.length,
    run_at: new Date().toISOString()
  };
  runs.push(run);
  return c.json(run);
});

app.get('/v1/evals/trends', (c) => {
  const grouped = new Map<string, any>();
  for (const run of runs) {
    if (!grouped.has(run.suite_id)) {
      grouped.set(run.suite_id, {
        suite_id: run.suite_id,
        suite_name: run.suite_name,
        runs: []
      });
    }
    grouped.get(run.suite_id).runs.push({
      run_id: run.id,
      avg_score: run.avg_score,
      run_at: run.run_at
    });
  }
  return c.json({ trends: Array.from(grouped.values()) });
});

app.post('/v1/evals/compare', async (c) => {
  const { run_id_a, run_id_b } = await c.req.json();
  const runA = runs.find(r => r.id === run_id_a);
  const runB = runs.find(r => r.id === run_id_b);
  
  if (!runA || !runB) return c.json({ error: 'Run not found' }, 404);
  
  const comparison = [];
  let avg_delta = 0;
  let improved_count = 0;
  let degraded_count = 0;
  
  const len = Math.min(runA.results.length, runB.results.length);
  let totalDelta = 0;
  
  for (let i = 0; i < len; i++) {
    const resA = runA.results[i];
    const resB = runB.results[i];
    const delta = resB.score - resA.score;
    comparison.push({
      test_case_index: i,
      score_a: resA.score,
      score_b: resB.score,
      delta
    });
    totalDelta += delta;
    if (delta > 0) improved_count++;
    if (delta < 0) degraded_count++;
  }
  
  if (len > 0) avg_delta = totalDelta / len;
  
  return c.json({
    comparison,
    summary: { avg_delta, improved_count, degraded_count }
  });
});

app.get('/v1/evals/results/:runId', (c) => {
  const run = runs.find(r => r.id === c.req.param('runId'));
  if (!run) return c.json({ error: 'Run not found' }, 404);
  return c.json(run);
});

export default app;
