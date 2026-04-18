-- Migration 004: Quote and Payment Flow
--
-- State machine for meetings.status:
--   pending    → quoted     (owner submits quote)
--              → expired    (24h with no quote — handled by cron)
--   quoted     → confirmed  (customer accepts)
--              → declined   (customer declines)
--              → expired    (72h with no response — handled by cron)
--   confirmed  → cancelled  (either party cancels pre-appointment)
--              → completed  (ends_at passes — handled by cron)
--   completed  → invoiced   (Stripe invoice created)
--   invoiced   → paid       (invoice.paid webhook)
--   Terminal states: cancelled, declined, expired, paid.

-- ── 1. Drop old status CHECK constraint ──────────────────────────────────────
ALTER TABLE meetings DROP CONSTRAINT IF EXISTS meetings_status_check;

-- ── 2. New columns on meetings ───────────────────────────────────────────────
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS quote_amount_cents       integer,
  ADD COLUMN IF NOT EXISTS quote_currency           text NOT NULL DEFAULT 'usd',
  ADD COLUMN IF NOT EXISTS quote_description        text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS quote_token              text UNIQUE,
  ADD COLUMN IF NOT EXISTS accept_token             text UNIQUE,
  ADD COLUMN IF NOT EXISTS manage_token             text UNIQUE,
  ADD COLUMN IF NOT EXISTS quoted_at                timestamptz,
  ADD COLUMN IF NOT EXISTS customer_confirmed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at             timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason      text,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id        text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_hosted_invoice_url text,
  ADD COLUMN IF NOT EXISTS invoice_sent_at          timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at                  timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at                  timestamptz;

-- ── 3. New status CHECK (9 valid states) ─────────────────────────────────────
ALTER TABLE meetings
  ADD CONSTRAINT meetings_status_check
  CHECK (status IN (
    'pending','quoted','confirmed','cancelled','completed',
    'invoiced','paid','expired','declined'
  ));

-- ── 4. New table: stripe_accounts ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stripe_accounts (
  user_phone              text PRIMARY KEY REFERENCES users(phone) ON DELETE CASCADE,
  stripe_account_id       text UNIQUE NOT NULL,
  charges_enabled         boolean NOT NULL DEFAULT false,
  payouts_enabled         boolean NOT NULL DEFAULT false,
  details_submitted       boolean NOT NULL DEFAULT false,
  onboarding_started_at   timestamptz NOT NULL DEFAULT now(),
  onboarding_completed_at timestamptz,
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- ── 5. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS meetings_quote_token_idx      ON meetings(quote_token);
CREATE INDEX IF NOT EXISTS meetings_accept_token_idx     ON meetings(accept_token);
CREATE INDEX IF NOT EXISTS meetings_manage_token_idx     ON meetings(manage_token);
CREATE INDEX IF NOT EXISTS meetings_status_ends_at_idx   ON meetings(status, ends_at);
CREATE INDEX IF NOT EXISTS meetings_stripe_invoice_id_idx ON meetings(stripe_invoice_id);
