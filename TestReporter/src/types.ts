export interface TestResult {
  service: string;
  suite: string;
  test_name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration_ms: number;
  error_message?: string;
  timestamp?: string;
}

export interface TestReport {
  id?: string;
  service: string;
  results: TestResult[];
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  ingested_at?: string;
}

export interface FlakyTest {
  service: string;
  test_name: string;
  pass_count: number;
  fail_count: number;
  flaky_rate: number;
}

export interface TrendPoint {
  service: string;
  date: string;
  pass_rate: number;
  total: number;
}
