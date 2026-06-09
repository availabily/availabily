-- Migration 010: Customer-selectable booking durations
--
-- Bookings were previously a fixed 1 hour. Customers can now choose a duration
-- (30 min up to 8 h) when requesting a time. end_time already encodes the span,
-- but storing duration_minutes keeps the chosen length explicit for display and
-- analytics. Defaults to 60 so existing rows keep their 1-hour semantics.

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60;
