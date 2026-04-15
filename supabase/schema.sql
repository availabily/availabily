-- Users table
CREATE TABLE users (
  phone text PRIMARY KEY,
  handle text UNIQUE NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX users_handle_idx ON users(handle);

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

-- Profile table (1:1 with users) — added in migration 002 + 003
-- Renamed from "profiles" to avoid conflict with a pre-existing table on the shared Supabase project.
CREATE TABLE amorpm_profiles (
  user_phone text PRIMARY KEY REFERENCES users(phone) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  business_name text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 300),
  avatar_url text NOT NULL DEFAULT '',
  gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  service_category text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  trust_bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  prompt_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Gallery images (legacy; newer code uses amorpm_profiles.gallery_urls) — added in migration 002
CREATE TABLE profile_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_phone text NOT NULL REFERENCES users(phone) ON DELETE CASCADE,
  image_type text NOT NULL CHECK (image_type IN ('avatar', 'gallery')),
  url text NOT NULL,
  thumbnail_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX profile_images_user_phone_idx ON profile_images(user_phone);

-- Storage bucket for profile images — added in migration 005
-- (actual bucket creation is handled by Supabase Storage API / migration 005)
