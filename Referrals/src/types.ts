export interface ReferralCode {
  code: string;
  user_id: string;
  created_at: string;
  uses: number;
}

export interface ReferralConversion {
  id: string;
  referrer_id: string;
  referred_id: string;
  code: string;
  converted_at: string;
  commission_cents?: number;
}

export interface ReferralStats {
  total_referrals: number;
  total_conversions: number;
  total_commission_cents: number;
}
