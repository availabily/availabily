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
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  confirm_token: string;
  created_at: string;
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
