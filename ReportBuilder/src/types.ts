export interface ReportColumn {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ReportFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: unknown;
}

export interface ReportTemplate {
  id?: string;
  name: string;
  description?: string;
  columns: ReportColumn[];
  filters?: ReportFilter[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  created_at?: string;
  updated_at?: string;
}

export interface GeneratedReport {
  id: string;
  template_id: string;
  template_name: string;
  data: Record<string, unknown>[];
  summary?: Record<string, number>;
  generated_at: string;
  row_count: number;
  export_formats: string[];
}

export interface ScheduledReport {
  id?: string;
  template_id: string;
  cron?: string;
  format: 'json' | 'csv';
  recipients?: string[];
  next_run?: string;
  created_at?: string;
}
