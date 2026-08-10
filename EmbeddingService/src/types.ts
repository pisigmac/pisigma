export interface EmbeddingRequest {
  input: string;
  provider?: string;
  model?: string;
  dimensions?: number;
}

export interface BatchEmbeddingRequest {
  inputs: string[];
  provider?: string;
  model?: string;
}

export interface EmbeddingResponse {
  input: string;
  vector: number[];
  dimensions: number;
  model: string;
  provider: string;
  cached: boolean;
}

export interface SimilarityRequest {
  input_a: string;
  input_b: string;
}

export interface SimilarityResponse {
  similarity: number;
  input_a: string;
  input_b: string;
  method: 'cosine';
}

export interface ProviderInfo {
  name: string;
  models: string[];
  default_dimensions: number;
}

export interface CacheStats {
  total_cached: number;
  hit_count: number;
  miss_count: number;
  hit_rate: number;
}
