export interface WAFRule {
  id: string;
  type: 'ip_block' | 'geo_fence' | 'pattern';
  value: string;
  action: 'block' | 'allow' | 'log';
  created_at: string;
}

export interface WAFEvaluation {
  ip: string;
  path?: string;
  user_agent?: string;
  country?: string;
}

export interface WAFResult {
  allowed: boolean;
  matched_rule?: WAFRule;
  action: string;
}
