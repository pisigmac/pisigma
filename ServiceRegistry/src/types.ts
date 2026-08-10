export type ServiceInstance = {
  name: string;
  port: number;
  version: string;
  host?: string;
  protocol?: string;
  metadata?: Record<string, string>;
  health_url?: string;
  status?: 'healthy' | 'unhealthy' | 'unknown';
  registered_at?: string;
  last_checked?: string;
  id?: string;
};

export type ServiceDependency = {
  from: string;
  to: string;
  type?: 'http' | 'grpc' | 'queue';
};

export type TopologyResponse = {
  services: ServiceInstance[];
  dependencies: ServiceDependency[];
  edges: number;
};

export type ClientResult<T> = {
  data?: T;
  error?: string;
};
