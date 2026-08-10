export interface Env {
  REALTIME_ENV?: string
}

export interface PublishMessageRequest {
  channel: string
  event: string
  data: Record<string, any>
  sender_id?: string
}

export interface PublishMessageResponse {
  success: boolean
  message_id: string
  channel: string
  event: string
  timestamp: string
}

export interface RealtimeMessage {
  message_id: string
  channel: string
  event: string
  data: Record<string, any>
  sender_id?: string
  timestamp: string
}

export interface PresenceRequest {
  channel: string
  user_id: string
  status?: 'online' | 'offline' | 'away'
  metadata?: Record<string, any>
}

export interface PresenceItem {
  user_id: string
  channel: string
  status: 'online' | 'offline' | 'away'
  last_seen: string
  metadata?: Record<string, any>
}

export interface GetPresenceResponse {
  channel: string
  active_users: PresenceItem[]
  total_count: number
}
