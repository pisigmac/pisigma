export interface QualityRule {
  id?: string;
  dataset: string;
  field: string;
  rule_type: 'not_null' | 'unique' | 'range' | 'regex' | 'enum' | 'type_check';
  params?: {
    min?: number;
    max?: number;
    pattern?: string;
    allowed?: unknown[];
    expected_type?: string;
  };
  severity: 'error' | 'warning';
  created_at?: string;
}

export interface QualityViolation {
  rule_id: string;
  field: string;
  rule_type: string;
  severity: string;
  row_index: number;
  actual_value: unknown;
  message: string;
}

export interface ValidationReport {
  id: string;
  dataset: string;
  total_rows: number;
  violations: QualityViolation[];
  violation_count: number;
  pass_rate: number;
  validated_at: string;
}

export interface DataProfile {
  dataset: string;
  field: string;
  total: number;
  non_null: number;
  null_count: number;
  unique_count: number;
  min?: number;
  max?: number;
  mean?: number;
  most_common?: { value: unknown; count: number }[];
}

export interface QualityScore {
  dataset: string;
  score: number;
  total_checks: number;
  passed_checks: number;
  last_validated?: string;
}
