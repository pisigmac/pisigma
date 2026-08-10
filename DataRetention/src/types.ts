export interface RetentionPolicy {
  id: string;
  data_type: string;
  retention_days: number;
  action: 'archive' | 'delete';
  created_at: string;
}

export interface RetentionExecution {
  id: string;
  policy_id: string;
  records_affected: number;
  executed_at: string;
}

export interface ErasureRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'completed';
  requested_at: string;
  completed_at?: string;
}
