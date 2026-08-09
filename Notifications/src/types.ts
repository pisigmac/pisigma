export interface Env {
  NOTIFICATIONS_PROVIDER?: string
}

export interface RegisterDeviceRequest {
  user_id: string
  device_token: string
  platform: 'web' | 'android' | 'ios'
}

export interface PushNotificationRequest {
  user_id: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export interface NotificationFeedItem {
  id: string
  user_id: string
  title: string
  body: string
  read: boolean
  created_at: string
}
