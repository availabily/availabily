-- Profile table (1:1 with users)
CREATE TABLE profiles (
  user_phone text PRIMARY KEY REFERENCES users(phone) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  business_name text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 300),
  avatar_url text NOT NULL DEFAULT '',
  service_category text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  trust_bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  prompt_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Gallery images (ordered, max 5 enforced in app layer)
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
