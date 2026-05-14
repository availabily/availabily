ALTER TABLE users ADD COLUMN IF NOT EXISTS payments_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS summary_sent_at timestamptz;
