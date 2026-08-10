export interface EvalTestCase {
  input: string;
  expected_output: string;
  tags?: string[];
}

export interface EvalSuite {
  id?: string;
  name: string;
  description?: string;
  test_cases: EvalTestCase[];
  created_at?: string;
}

export type EvalScorer = 'exact_match' | 'contains' | 'levenshtein' | 'length_ratio';

export interface EvalRunResult {
  test_case_index: number;
  input: string;
  expected: string;
  actual: string;
  score: number;
  passed: boolean;
  scorer: string;
}

export interface EvalRun {
  id: string;
  suite_id: string;
  suite_name: string;
  model_endpoint?: string;
  scorer: EvalScorer;
  results: EvalRunResult[];
  total: number;
  passed: number;
  failed: number;
  avg_score: number;
  run_at: string;
}
