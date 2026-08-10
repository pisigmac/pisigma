export interface Channel {
  id: string;
  name: string;
  members: string[];
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  read_by?: string[];
}
