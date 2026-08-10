export interface MonitoredService {
  id?: string;
  name: string;
  health_url: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'unknown';
  last_checked?: string;
  last_response_ms?: number;
  uptime_percentage?: number;
  registered_at?: string;
}

export interface UptimeRecord {
  service_name: string;
  timestamp: string;
  status: 'up' | 'down';
  response_ms: number;
}

export interface MaintenanceWindow {
  id?: string;
  title: string;
  description?: string;
  affected_services: string[];
  starts_at: string;
  ends_at: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  created_at?: string;
}

export interface StatusSummary {
  overall_status: 'all_operational' | 'partial_issues' | 'major_outage';
  services: MonitoredService[];
  active_incidents_count: number;
  upcoming_maintenance: MaintenanceWindow[];
  last_updated: string;
}
