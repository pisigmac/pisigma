export interface Env {
  SEARCH_ENV?: string
  SEARCH_INDEX_NAME?: string
  SEARCH_API_KEY?: string
}

export interface DocumentInput {
  id: string
  title: string
  content: string
  metadata?: Record<string, unknown>
  tags?: string[]
}

export interface IndexRequest {
  index_name?: string
  documents: DocumentInput[]
}

export interface SearchQueryRequest {
  index_name?: string
  query: string
  limit?: number
  filters?: Record<string, unknown>
}

export interface SearchResultItem {
  id: string
  title: string
  content: string
  score: number
  metadata?: Record<string, unknown>
  tags?: string[]
}

export interface SearchQueryResponse {
  query: string
  index_name: string
  total: number
  results: SearchResultItem[]
}
