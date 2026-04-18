-- Migration 006: Payment tracking fields
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS payment_failure_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at             timestamptz;
