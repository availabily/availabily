import { User } from './types';
import { demoStore } from './demo-store';
import { createServerClient } from './supabase';
import { isDemo, getStripe } from './stripe';

// Stripe subscription statuses that count as "subscribed" for fee purposes.
const ACTIVE_STATUSES = ['active', 'trialing'];

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

/** Is this owner on the active $4.99/mo plan? */
export function isSubscribed(
  user: Pick<User, 'subscription_status'> | null | undefined
): boolean {
  return !!user && ACTIVE_STATUSES.includes(user.subscription_status ?? 'none');
}

/**
 * Platform application-fee percent for an owner's invoices.
 * Subscribers pay less. Defaults: 4% subscribed, 7% not.
 */
export function applicationFeePercentFor(
  user: Pick<User, 'subscription_status'> | null | undefined
): number {
  const subscribed = parseFloat(process.env.STRIPE_FEE_PERCENT_SUBSCRIBED || '4');
  const standard = parseFloat(process.env.STRIPE_FEE_PERCENT_DEFAULT || '7');
  return isSubscribed(user) ? subscribed : standard;
}

async function loadUser(userPhone: string): Promise<User | null> {
  if (isDemo) return demoStore.getUserByPhone(userPhone);
  const supabase = createServerClient();
  const { data } = await supabase.from('users').select('*').eq('phone', userPhone).maybeSingle();
  return (data as User) ?? null;
}

async function saveUser(userPhone: string, data: Partial<User>): Promise<void> {
  if (isDemo) {
    demoStore.updateUser(userPhone, data);
    return;
  }
  const supabase = createServerClient();
  await supabase.from('users').update(data).eq('phone', userPhone);
}

/** Get or create the owner's customer record on the PLATFORM Stripe account. */
async function ensurePlatformCustomer(user: User): Promise<string> {
  if (user.stripe_customer_id) return user.stripe_customer_id;
  const stripe = getStripe();
  const customer = await stripe.customers.create(
    {
      email: user.email || undefined,
      metadata: { platform_user_phone: user.phone },
    },
    { idempotencyKey: `platform-customer-${user.phone}` }
  );
  await saveUser(user.phone, { stripe_customer_id: customer.id });
  return customer.id;
}

/**
 * Start a $4.99/mo subscription checkout. Returns a URL to redirect the owner to.
 * On success Stripe returns them to /api/subscribe/return (which syncs status).
 * In demo mode the subscription is activated immediately.
 */
export async function createSubscriptionCheckoutUrl(
  userPhone: string,
  returnToken: string
): Promise<string> {
  const baseUrl = getBaseUrl();
  const encodedToken = encodeURIComponent(returnToken);

  if (isDemo) {
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    demoStore.updateUser(userPhone, {
      subscription_status: 'active',
      stripe_customer_id: `cus_demo_platform_${userPhone.replace(/\D/g, '')}`,
      stripe_subscription_id: `sub_demo_${userPhone.replace(/\D/g, '')}`,
      subscription_current_period_end: periodEnd,
    });
    return `${baseUrl}/q/${encodedToken}?subscribed=1`;
  }

  const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
  if (!priceId) throw new Error('STRIPE_SUBSCRIPTION_PRICE_ID not set');

  const user = await loadUser(userPhone);
  if (!user) throw new Error('Owner not found');

  const customerId = await ensurePlatformCustomer(user);
  const stripe = getStripe();
  const encodedPhone = encodeURIComponent(userPhone);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/api/subscribe/return?phone=${encodedPhone}&token=${encodedToken}`,
    cancel_url: `${baseUrl}/q/${encodedToken}`,
    metadata: { platform_user_phone: userPhone },
    subscription_data: { metadata: { platform_user_phone: userPhone } },
  });

  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return session.url;
}

/**
 * Re-read the owner's subscription from Stripe and persist the status. Used on
 * the post-checkout return (so we don't depend solely on the webhook). Returns
 * the resolved status string.
 */
export async function syncSubscription(userPhone: string): Promise<string> {
  if (isDemo) {
    return loadUser(userPhone).then(u => u?.subscription_status ?? 'none');
  }

  const user = await loadUser(userPhone);
  if (!user?.stripe_customer_id) return 'none';

  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({
    customer: user.stripe_customer_id,
    status: 'all',
    limit: 5,
  });
  const active = subs.data.find(s => ACTIVE_STATUSES.includes(s.status));
  const chosen = active ?? subs.data[0] ?? null;
  const status = chosen?.status ?? 'none';
  // current_period_end is on the subscription object (epoch seconds).
  const periodEnd =
    chosen && 'current_period_end' in chosen && chosen.current_period_end
      ? new Date((chosen.current_period_end as number) * 1000).toISOString()
      : null;

  await saveUser(userPhone, {
    subscription_status: status,
    stripe_subscription_id: chosen?.id ?? null,
    subscription_current_period_end: periodEnd,
  });
  return status;
}

/**
 * Persist a subscription status update coming from a Stripe webhook event.
 * `userPhone` is read from the subscription/session metadata.
 */
export async function applySubscriptionUpdate(params: {
  userPhone: string;
  status: string;
  subscriptionId?: string | null;
  currentPeriodEnd?: number | null;
}): Promise<void> {
  await saveUser(params.userPhone, {
    subscription_status: params.status,
    stripe_subscription_id: params.subscriptionId ?? null,
    subscription_current_period_end: params.currentPeriodEnd
      ? new Date(params.currentPeriodEnd * 1000).toISOString()
      : null,
  });
}
