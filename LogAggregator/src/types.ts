export interface LogEntry {
  id: string;
  service: string;
  level: 'info'|'warn'|'error'|'debug';
  message: string;
  timestamp: string;
  metadata?: any;
}

export interface LogQuery {
  service?: string;
  level?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface LogStats {
  total: number;
  by_level: Record<string, number>;
  by_service: Record<string, number>;
}
