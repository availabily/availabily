-- Migration 011: Booking type (consultation vs quoted service)
--
-- Not every booking has a price. Real-estate walkthroughs, free consultations,
-- discovery calls, and site surveys are meetings with no quote/invoice/payment.
-- The owner picks the type when handling a pending request. Consultations reuse
-- the existing confirmed → completed path (completed is terminal for them); the
-- cron skips them in the invoice phase. Defaults to 'quoted_service' so existing
-- rows keep today's behavior. NOT NULL is load-bearing: the cron excludes
-- consultations via `booking_type <> 'consultation'`, which would silently drop
-- NULL rows.

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS booking_type text NOT NULL DEFAULT 'quoted_service';

ALTER TABLE meetings
  DROP CONSTRAINT IF EXISTS meetings_booking_type_check;
ALTER TABLE meetings
  ADD CONSTRAINT meetings_booking_type_check
  CHECK (booking_type IN ('consultation', 'quoted_service'));
