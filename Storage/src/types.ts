export interface Env {
  STORAGE_BUCKET_NAME?: string
  STORAGE_BASE_URL?: string
  STORAGE_SECRET_KEY?: string
}

export interface PresignedUploadRequest {
  filename: string
  mime_type: string
  size_bytes: number
  ttl_seconds?: number
}

export interface PresignedUploadResponse {
  upload_url: string
  file_id: string
  expires_at: number
}
