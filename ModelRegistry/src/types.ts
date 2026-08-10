export interface ModelMetrics {
  accuracy?: number;
  latency_ms?: number;
  f1_score?: number;
  precision?: number;
  recall?: number;
  loss?: number;
  custom?: Record<string, number>;
}

export interface ModelVersion {
  version: number;
  framework: string;
  metrics: ModelMetrics;
  parameters?: Record<string, unknown>;
  artifact_url?: string;
  status: 'staging' | 'production' | 'archived' | 'draft';
  created_at: string;
  promoted_at?: string;
  notes?: string;
}

export interface RegisteredModel {
  id?: string;
  name: string;
  description?: string;
  owner?: string;
  tags?: string[];
  versions: ModelVersion[];
  created_at?: string;
  updated_at?: string;
}

export interface ComparisonResult {
  model_name: string;
  version_a: number;
  version_b: number;
  metrics_diff: Record<string, { a: number, b: number, delta: number, improved: boolean }>;
}
