-- Migration 012: Owner subscription (platform-side $4.99/mo plan)
--
-- Quoted Service is the premium flow. Owners can subscribe to a $4.99/mo plan to
-- pay a lower platform application fee on each invoice (4% instead of 7%). This
-- subscription is on the PLATFORM Stripe account and is separate from Stripe
-- Connect (which is how owners RECEIVE customer payments).
--
-- subscription_status mirrors Stripe's subscription status ('active','trialing',
-- 'past_due','canceled', …); 'none' means never subscribed. stripe_customer_id is
-- the owner's customer record on the PLATFORM account (not a connected account).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status              text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS stripe_customer_id               text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id           text,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end  timestamptz;
