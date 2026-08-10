export interface Content {
  id: string;
  slug: string;
  title: string;
  body: string;
  status: 'draft' | 'published';
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ContentVersion {
  content_id: string;
  version: number;
  body: string;
  created_at: string;
}
