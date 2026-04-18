-- Migration 005: Drop confirm_token column
-- The /c/[token] auto-confirm flow has been replaced by the quote → accept flow.
-- confirm_token is no longer generated or referenced by the application.
ALTER TABLE meetings DROP COLUMN IF EXISTS confirm_token;
