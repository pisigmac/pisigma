export interface PipelineJob {
  id: string;
  name: string;
  source_format: 'csv' | 'json' | 'xml';
  target_format: 'csv' | 'json';
  status: 'pending' | 'running' | 'completed' | 'failed';
  records_processed?: number;
  created_at: string;
}

export interface TransformRequest {
  data: any[];
  operations: string[];
}
