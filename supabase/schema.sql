-- Users table
CREATE TABLE users (
  phone text PRIMARY KEY,
  handle text UNIQUE NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  email text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX users_handle_idx ON users(handle);
CREATE INDEX users_email_idx ON users(email);

-- Time rules table
CREATE TABLE time_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone text NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
  rule_type text NOT NULL CHECK (rule_type IN ('available', 'blocked')),
  date date,
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_recurring boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX time_rules_user_phone_idx ON time_rules(user_phone);

-- Meetings table
CREATE TABLE meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone text NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
  meeting_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  visitor_name text NOT NULL,
  visitor_phone text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  confirm_token text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX meetings_confirm_token_idx ON meetings(confirm_token);
CREATE INDEX meetings_user_phone_idx ON meetings(user_phone);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_phone TEXT REFERENCES users(phone) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX notifications_user_phone_idx ON notifications(user_phone);
CREATE INDEX notifications_unread_idx ON notifications(user_phone, is_read) WHERE is_read = false;

-- Magic codes table (for email-based login)
CREATE TABLE magic_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX magic_codes_email_idx ON magic_codes(email);

-- Migration: add email column to existing users table
-- ALTER TABLE users ADD COLUMN email text;
-- CREATE INDEX users_email_idx ON users(email);
