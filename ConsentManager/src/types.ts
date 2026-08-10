export interface ConsentRecord {
  id: string;
  user_id: string;
  purpose: 'analytics' | 'marketing' | 'functional' | 'necessary';
  granted: boolean;
  timestamp: string;
  ip_address?: string;
}

export interface DSARRequest {
  id: string;
  user_id: string;
  type: 'access' | 'erasure' | 'portability';
  status: 'pending' | 'processing' | 'completed';
  created_at: string;
}

export interface ConsentPolicy {
  id: string;
  name: string;
  description: string;
  required: boolean;
}
