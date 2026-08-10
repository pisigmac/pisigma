export interface QueueMessage {
  id: string;
  queue: string;
  payload: any;
  created_at: number;
  status: string;
  retries?: number;
}

export interface QueueSubscriber {
  queue: string;
  webhook_url: string;
}

export interface QueueStats {
  depth: number;
  processed: number;
  failed: number;
  dlq_count: number;
}