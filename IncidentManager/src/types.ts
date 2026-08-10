export type IncidentSeverity = 'p1_critical' | 'p2_high' | 'p3_medium' | 'p4_low';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'postmortem';

export interface TimelineEntry {
  message: string;
  author: string;
  status_change?: IncidentStatus;
  timestamp: string;
}

export interface Incident {
  id?: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affected_services: string[];
  commander?: string;
  timeline: TimelineEntry[];
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
  duration_minutes?: number;
}

export interface Postmortem {
  incident_id: string;
  root_cause: string;
  impact_summary: string;
  action_items: Array<{
    task: string;
    owner: string;
    due_date?: string;
    status: 'open' | 'in_progress' | 'done';
  }>;
  lessons_learned?: string[];
  created_at?: string;
}

export interface OnCallRotation {
  id?: string;
  team: string;
  members: Array<{
    name: string;
    email: string;
    phone?: string;
  }>;
  current_index: number;
  rotation_period: 'daily' | 'weekly';
  created_at?: string;
}
