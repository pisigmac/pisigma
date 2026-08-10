export interface AlertRule {
  id?: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'gte' | 'lte' | 'eq';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  channel?: string;
  cooldown_minutes?: number;
  enabled?: boolean;
  created_at?: string;
}

export interface AlertEvent {
  id: string;
  rule_id: string;
  rule_name: string;
  metric: string;
  actual_value: number;
  threshold: number;
  condition: string;
  severity: string;
  triggered_at: string;
  acknowledged?: boolean;
}

export interface EscalationPolicy {
  id?: string;
  name: string;
  levels: Array<{ delay_minutes: number, channel: string, target: string }>;
  created_at?: string;
}
