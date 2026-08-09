export interface Env {
  MEDIA_PROCESSING_ENGINE?: string
  MAX_FILE_SIZE_MB?: string
  MEDIA_SECRET_KEY?: string
}

export interface TransformPreset {
  id: string
  name: string
  description: string
  format: 'jpeg' | 'png' | 'webp' | 'mp4' | 'mp3'
  width?: number
  height?: number
  quality?: number
}

export interface MediaTransformRequest {
  source_url: string
  target_format: 'jpeg' | 'png' | 'webp' | 'gif' | 'mp4' | 'mp3' | 'wav'
  width?: number
  height?: number
  quality?: number
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
  preset?: string
}

export interface MediaTransformResponse {
  job_id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  source_url: string
  target_format: string
  output_url?: string
  width?: number
  height?: number
  created_at: string
}
