import { StripeAccount } from './types';
import { demoStore } from './demo-store';
import { createServerClient } from './supabase';
import { isDemo, getStripe } from './stripe';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export async function ensureAccountRecord(userPhone: string): Promise<StripeAccount> {
  if (isDemo) {
    let account = demoStore.getStripeAccount(userPhone);
    if (!account) {
      account = {
        user_phone: userPhone,
        stripe_account_id: `acct_demo_${userPhone.replace(/\D/g, '')}`,
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        onboarding_started_at: new Date().toISOString(),
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      demoStore.upsertStripeAccount(account);
    }
    return account;
  }

  const supabase = createServerClient();
  const { data: existing } = await supabase
    .from('stripe_accounts')
    .select('*')
    .eq('user_phone', userPhone)
    .maybeSingle();

  if (existing?.stripe_account_id) {
    return existing as StripeAccount;
  }

  const stripe = getStripe();
  const stripeAccount = await stripe.accounts.create(
    {
      type: 'express',
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: { platform_user_phone: userPhone },
    },
    { idempotencyKey: `connect-create-${userPhone}` }
  );

  const now = new Date().toISOString();
  const record: StripeAccount = {
    user_phone: userPhone,
    stripe_account_id: stripeAccount.id,
    charges_enabled: false,
    payouts_enabled: false,
    details_submitted: false,
    onboarding_started_at: now,
    onboarding_completed_at: null,
    updated_at: now,
  };

  await supabase.from('stripe_accounts').upsert({
    user_phone: record.user_phone,
    stripe_account_id: record.stripe_account_id,
    charges_enabled: record.charges_enabled,
    payouts_enabled: record.payouts_enabled,
    details_submitted: record.details_submitted,
    onboarding_started_at: record.onboarding_started_at,
    onboarding_completed_at: record.onboarding_completed_at,
    updated_at: record.updated_at,
  });

  return record;
}

export async function createOnboardingLink(
  accountId: string,
  userPhone: string
): Promise<string> {
  const baseUrl = getBaseUrl();
  const encoded = encodeURIComponent(userPhone);

  if (isDemo) {
    return `${baseUrl}/api/connect/return?phone=${encoded}`;
  }

  const stripe = getStripe();
  const link = await stripe.accountLinks.create(
    {
      account: accountId,
      refresh_url: `${baseUrl}/api/connect/refresh?phone=${encoded}`,
      return_url: `${baseUrl}/api/connect/return?phone=${encoded}`,
      type: 'account_onboarding',
    },
    { idempotencyKey: `connect-link-${accountId}-${Date.now()}` }
  );

  return link.url;
}

export async function refreshAccountStatus(userPhone: string): Promise<StripeAccount> {
  if (isDemo) {
    const now = new Date().toISOString();
    const existing = demoStore.getStripeAccount(userPhone);
    const updated: StripeAccount = {
      ...(existing ?? {
        user_phone: userPhone,
        stripe_account_id: `acct_demo_${userPhone.replace(/\D/g, '')}`,
        onboarding_started_at: now,
      }),
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
      onboarding_completed_at: now,
      updated_at: now,
    } as StripeAccount;
    demoStore.upsertStripeAccount(updated);
    return updated;
  }

  const supabase = createServerClient();
  const { data: existing } = await supabase
    .from('stripe_accounts')
    .select('*')
    .eq('user_phone', userPhone)
    .maybeSingle();

  if (!existing?.stripe_account_id) {
    return ensureAccountRecord(userPhone);
  }

  const stripe = getStripe();
  const sa = await stripe.accounts.retrieve(existing.stripe_account_id);

  const now = new Date().toISOString();
  const wasEnabled = existing.charges_enabled;
  const completedAt =
    sa.charges_enabled && !wasEnabled
      ? now
      : (existing.onboarding_completed_at ?? null);

  const updated: Partial<StripeAccount> = {
    charges_enabled: sa.charges_enabled ?? false,
    payouts_enabled: sa.payouts_enabled ?? false,
    details_submitted: sa.details_submitted ?? false,
    onboarding_completed_at: completedAt,
    updated_at: now,
  };

  await supabase
    .from('stripe_accounts')
    .update(updated)
    .eq('user_phone', userPhone);

  return { ...(existing as StripeAccount), ...updated };
}

export async function getAccountStatus(userPhone: string): Promise<{
  exists: boolean;
  charges_enabled: boolean;
  details_submitted: boolean;
  payouts_enabled: boolean;
} | null> {
  if (isDemo) {
    const account = demoStore.getStripeAccount(userPhone);
    if (!account) return null;
    return {
      exists: true,
      charges_enabled: account.charges_enabled,
      details_submitted: account.details_submitted,
      payouts_enabled: account.payouts_enabled,
    };
  }

  const supabase = createServerClient();
  const { data } = await supabase
    .from('stripe_accounts')
    .select('charges_enabled, details_submitted, payouts_enabled')
    .eq('user_phone', userPhone)
    .maybeSingle();

  if (!data) return null;
  return {
    exists: true,
    charges_enabled: data.charges_enabled ?? false,
    details_submitted: data.details_submitted ?? false,
    payouts_enabled: data.payouts_enabled ?? false,
  };
}
