-- Add optional response_time_minutes column to profiles.
-- Represents the typical response time in minutes (used for "Responds quickly" badge).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS response_time_minutes integer;
