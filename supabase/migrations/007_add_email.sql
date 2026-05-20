ALTER TABLE users ADD COLUMN IF NOT EXISTS email text UNIQUE;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS visitor_email text;
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
