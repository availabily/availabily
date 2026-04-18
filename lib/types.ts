export interface User {
  phone: string;
  handle: string;
  timezone: string;
  created_at: string;
}

export interface TimeRule {
  id: string;
  user_phone: string;
  rule_type: 'available' | 'blocked';
  date: string | null;
  day_of_week: number | null;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  created_at: string;
}

export interface Meeting {
  id: string;
  user_phone: string;
  meeting_date: string;
  start_time: string;
  end_time: string;
  visitor_name: string;
  visitor_phone: string;
  note: string | null; // stores visitor_address for backward compatibility
  status:
    | 'pending'
    | 'quoted'
    | 'confirmed'
    | 'cancelled'
    | 'completed'
    | 'invoiced'
    | 'paid'
    | 'expired'
    | 'declined';
  created_at: string;

  // Quote & payment fields (all nullable until populated)
  quote_amount_cents: number | null;
  quote_currency: string;
  quote_description: string;
  quote_token: string | null;
  accept_token: string | null;
  manage_token: string | null;
  quoted_at: string | null;
  customer_confirmed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_hosted_invoice_url: string | null;
  invoice_sent_at: string | null;
  paid_at: string | null;
  ends_at: string | null;
}

export interface StripeAccount {
  user_phone: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  onboarding_started_at: string;
  onboarding_completed_at: string | null;
  updated_at: string;
}

export interface TimeSlot {
  start_time: string; // "HH:MM"
  end_time: string;   // "HH:MM"
}

export interface DayAvailability {
  date: string;       // "YYYY-MM-DD"
  day_name: string;
  slots: TimeSlot[];
}

export interface AvailabilityResponse {
  handle: string;
  timezone: string;
  days: DayAvailability[];
}

// ── Profile Layer Types ──

export interface PromptBlock {
  id: string;
  prompt: string;
  answer: string;
}

export interface Profile {
  user_phone: string;
  display_name: string;
  business_name: string;
  headline: string;
  bio: string;
  avatar_url: string;
  gallery_urls: string[];
  service_category: string;
  location: string;
  trust_bullets: string[];
  prompt_blocks: PromptBlock[];
  created_at?: string;
  updated_at?: string;
}

export interface ProfileImage {
  id: string;
  user_phone: string;
  image_type: 'avatar' | 'gallery';
  url: string;
  thumbnail_url: string;
  sort_order: number;
  created_at?: string;
}
