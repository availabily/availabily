-- Add gallery_urls column to amorpm_profiles (stores up to 5 ordered image URLs).
-- Nullable-safe: defaults to an empty array so existing rows remain valid.
ALTER TABLE amorpm_profiles
  ADD COLUMN IF NOT EXISTS gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb;
