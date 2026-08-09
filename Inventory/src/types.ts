export interface Env {
  INVENTORY_ENV?: string
}

export interface InventorySKU {
  sku_id: string
  name: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  location?: string
  updated_at: string
}

export interface ReservationRequest {
  sku_id: string
  quantity: number
  reservation_id?: string
}

export interface ReservationResult {
  reservation_id: string
  sku_id: string
  quantity: number
  status: 'reserved' | 'insufficient_stock' | 'failed'
  remaining_stock: number
  expires_at?: string
  error?: string
}
