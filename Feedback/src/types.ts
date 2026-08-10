export interface Env {
  FEEDBACK_ENV?: string
}

export interface FeedbackItem {
  id: string
  user_id?: string
  category: string
  rating?: number
  comment: string
  metadata?: Record<string, any>
  created_at: string
}

export interface SubmitFeedbackRequest {
  user_id?: string
  category?: string
  rating?: number
  comment: string
  metadata?: Record<string, any>
}

export interface SubmitFeedbackResponse {
  success: boolean
  feedback: FeedbackItem
}

export interface FeedbackSummary {
  total_count: number
  average_rating: number
  category_counts: Record<string, number>
  rating_distribution: Record<number, number>
}
