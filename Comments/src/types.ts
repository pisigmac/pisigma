export interface Comment {
  id: string;
  resource_id: string;
  author_id: string;
  content: string;
  parent_id?: string;
  reactions?: Record<string, number>;
  status: 'active' | 'flagged' | 'deleted';
  created_at: string;
}
