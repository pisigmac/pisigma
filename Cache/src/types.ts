export interface CacheEntry {
  key: string;
  value: any;
  ttl?: number;
  namespace?: string;
  created_at: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys_count: number;
}