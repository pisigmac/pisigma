export interface Env {
  DISCOUNTS_ENV?: string
}

export interface Coupon {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_cart_amount?: number
  max_discount_amount?: number
  active: boolean
  created_at: string
  expires_at?: string
}

export interface CreateCouponRequest {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_cart_amount?: number
  max_discount_amount?: number
  expires_at?: string
}

export interface CartItem {
  id: string
  price: number
  quantity: number
  category?: string
}

export interface DiscountEvaluationRequest {
  code?: string
  cart_total: number
  items?: CartItem[]
  user_id?: string
  currency?: string
}

export interface DiscountEvaluationResult {
  code?: string
  valid: boolean
  discount_amount: number
  final_total: number
  discount_type?: 'percentage' | 'fixed'
  message?: string
}
