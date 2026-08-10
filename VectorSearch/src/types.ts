export interface VectorEntry {
  id: string;
  collection: string;
  embedding: number[];
  metadata?: Record<string, string>;
  created_at: string;
}

export interface VectorQuery {
  collection: string;
  embedding: number[];
  top_k?: number;
}

export interface VectorResult {
  id: string;
  score: number;
  metadata?: Record<string, string>;
}
