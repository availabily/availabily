import { Meeting, Profile, User } from './types';
import { demoStore } from './demo-store';
import { createServerClient } from './supabase';
import { isDemo, getStripe } from './stripe';
import { sendSMS } from './twilio';
import { ownerDisplayName } from './owner-display';
import { formatDollars, formatDateDisplay, formatShortDay, formatTime } from './utils';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export async function getOrCreateConnectedCustomer(params: {
  ownerStripeAccountId: string;
  ownerPhone: string;
  ownerName: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
}): Promise<string> {
  if (isDemo) {
    return `cus_demo_${params.visitorPhone.replace(/\D/g, '')}`;
  }

  const stripe = getStripe();
  const { data: existing } = await stripe.customers.search(
    { query: `metadata['visitor_phone']:'${params.visitorPhone}'` },
    { stripeAccount: params.ownerStripeAccountId }
  );
  if (existing.length > 0) return existing[0].id;

  const customer = await stripe.customers.create(
    {
      name: params.visitorName,
      phone: params.visitorPhone,
      email: params.visitorEmail || undefined,
      metadata: {
        visitor_phone: params.visitorPhone,
        platform_owner_phone: params.ownerPhone,
      },
    },
    {
      stripeAccount: params.ownerStripeAccountId,
      idempotencyKey: `customer-${params.ownerPhone}-${params.visitorPhone}`,
    }
  );
  return customer.id;
}

export async function sendInvoiceSmses(
  meeting: Meeting,
  profile: Profile | null,
  user: User,
  hosted_url: string,
  amount_cents: number
): Promise<void> {
  const ownerName = ownerDisplayName(profile, user);
  const amount = formatDollars(amount_cents);
  const shortDate = formatShortDay(meeting.meeting_date);
  const time = formatTime(meeting.start_time);

  const customerSms = `${ownerName} sent you an invoice for ${shortDate} ${time}: $${amount}. Pay here: ${hosted_url}`;
  const ownerSms = `Invoice sent to ${meeting.visitor_name} for $${amount}. You'll get paid out to your bank within 2 business days after they pay.`;

  try {
    await sendSMS(meeting.visitor_phone, customerSms);
  } catch (err) {
    console.error('Failed to send invoice SMS to customer:', err);
  }
  try {
    await sendSMS(meeting.user_phone, ownerSms);
  } catch (err) {
    console.error('Failed to send invoice SMS to owner:', err);
  }
}

export async function createInvoiceForMeeting(meetingId: string): Promise<{
  invoice_id: string;
  hosted_url: string;
  amount_cents: number;
}> {
  const baseUrl = getBaseUrl();

  // ── Step 1: Atomic claim ──────────────────────────────────────────────────
  let meeting: Meeting;

  if (isDemo) {
    const candidate = demoStore.getMeetingById(meetingId);
    if (
      !candidate ||
      candidate.status !== 'completed' ||
      candidate.stripe_invoice_id != null
    ) {
      throw new Error('meeting not claimable');
    }
    demoStore.updateMeeting(meetingId, { status: 'invoiced' });
    meeting = { ...candidate, status: 'invoiced' };
  } else {
    const supabase = createServerClient();
    const { data: claimed } = await supabase
      .from('meetings')
      .update({ status: 'invoiced' })
      .eq('id', meetingId)
      .eq('status', 'completed')
      .is('stripe_invoice_id', null)
      .select('*')
      .maybeSingle();

    if (!claimed) throw new Error('meeting not claimable');
    meeting = claimed as Meeting;
  }

  // ── Step 2: Load owner, profile, stripe account ───────────────────────────
  let user: User;
  let profile: Profile | null;
  let stripeAccountId: string;

  try {
    if (isDemo) {
      const u = demoStore.getUserByPhone(meeting.user_phone);
      if (!u) throw new Error('Owner user not found');
      user = u;
      profile = demoStore.getProfile(meeting.user_phone);
      const sa = demoStore.getStripeAccount(meeting.user_phone);
      if (!sa?.charges_enabled) throw new Error('Owner Stripe account not charges-enabled');
      stripeAccountId = sa.stripe_account_id;
    } else {
      const supabase = createServerClient();
      const [{ data: userData }, { data: profileData }, { data: saData }] = await Promise.all([
        supabase.from('users').select('*').eq('phone', meeting.user_phone).single(),
        supabase.from('profiles').select('*').eq('user_phone', meeting.user_phone).maybeSingle(),
        supabase
          .from('stripe_accounts')
          .select('*')
          .eq('user_phone', meeting.user_phone)
          .maybeSingle(),
      ]);
      if (!userData) throw new Error('Owner user not found');
      if (!saData?.charges_enabled) {
        console.error(
          `ALERT: Meeting ${meetingId} reached invoice step but owner ${meeting.user_phone} has no charges-enabled Stripe account`
        );
        throw new Error('Owner Stripe account not charges-enabled');
      }
      user = userData as User;
      profile = profileData as Profile | null;
      stripeAccountId = saData.stripe_account_id;
    }
  } catch (err) {
    await revertToCompleted(meetingId);
    throw err;
  }

  // ── Step 3: Customer ──────────────────────────────────────────────────────
  let customerId: string;
  try {
    customerId = await getOrCreateConnectedCustomer({
      ownerStripeAccountId: stripeAccountId,
      ownerPhone: meeting.user_phone,
      ownerName: ownerDisplayName(profile, user),
      visitorName: meeting.visitor_name,
      visitorPhone: meeting.visitor_phone,
    });
  } catch (err) {
    await revertToCompleted(meetingId);
    throw err;
  }

  // ── Step 4: Application fee ───────────────────────────────────────────────
  const feePercent = parseFloat(process.env.STRIPE_APPLICATION_FEE_PERCENT || '5');
  const applicationFeeAmount = Math.round((meeting.quote_amount_cents ?? 0) * (feePercent / 100));

  // ── Step 5–8: Build invoice content ──────────────────────────────────────
  let lineDesc = meeting.quote_description || 'Service';
  if (profile?.service_category) {
    lineDesc = `${profile.service_category} — ${lineDesc}`;
  }
  lineDesc = lineDesc.slice(0, 500);

  const invoiceDesc = `${ownerDisplayName(profile, user)} — appointment on ${formatDateDisplay(meeting.meeting_date)}`;

  const customFields: { name: string; value: string }[] = [
    {
      name: 'Appointment',
      value: `${formatShortDay(meeting.meeting_date)} ${formatTime(meeting.start_time)}`.slice(0, 30),
    },
  ];
  if (profile?.service_category) {
    customFields.push({ name: 'Service', value: profile.service_category.slice(0, 30) });
  }

  let footer = ownerDisplayName(profile, user);
  if (profile?.location) footer += ` · ${profile.location}`;
  if (profile?.headline) footer = `${footer}\n${profile.headline}`;
  footer = footer.slice(0, 500);

  // ── Step 9: Demo short-circuit ────────────────────────────────────────────
  if (isDemo) {
    const invoiceId = `in_demo_${meetingId}`;
    const hostedUrl = `${baseUrl}/demo/invoice/${meetingId}`;
    const now = new Date().toISOString();
    demoStore.updateMeeting(meetingId, {
      stripe_invoice_id: invoiceId,
      stripe_hosted_invoice_url: hostedUrl,
      invoice_sent_at: now,
    });
    await sendInvoiceSmses(
      meeting,
      profile,
      user,
      hostedUrl,
      meeting.quote_amount_cents ?? 0
    );
    return {
      invoice_id: invoiceId,
      hosted_url: hostedUrl,
      amount_cents: meeting.quote_amount_cents ?? 0,
    };
  }

  // ── Step 10: Real Stripe path ─────────────────────────────────────────────
  const stripe = getStripe();
  const supabase = createServerClient();
  try {
    // 10a: invoice item
    await stripe.invoiceItems.create(
      {
        customer: customerId,
        amount: meeting.quote_amount_cents ?? 0,
        currency: meeting.quote_currency || 'usd',
        description: lineDesc,
        metadata: { meeting_id: meetingId },
      },
      {
        stripeAccount: stripeAccountId,
        idempotencyKey: `invoice-item-${meetingId}`,
      }
    );

    // 10b: invoice
    const invoice = await stripe.invoices.create(
      {
        customer: customerId,
        collection_method: 'send_invoice',
        days_until_due: 7,
        application_fee_amount: applicationFeeAmount,
        description: invoiceDesc,
        custom_fields: customFields,
        footer,
        auto_advance: true,
        metadata: {
          meeting_id: meetingId,
          platform_owner_phone: user.phone,
        },
      },
      {
        stripeAccount: stripeAccountId,
        idempotencyKey: `invoice-create-${meetingId}`,
      }
    );

    // 10c: finalize
    const finalized = await stripe.invoices.finalizeInvoice(
      invoice.id,
      undefined,
      {
        stripeAccount: stripeAccountId,
        idempotencyKey: `invoice-finalize-${meetingId}`,
      }
    );

    const hostedUrl = finalized.hosted_invoice_url ?? '';
    const now = new Date().toISOString();

    // 10d: persist (payment_intent is in finalized.payments in Stripe v22+)
    await supabase
      .from('meetings')
      .update({
        stripe_invoice_id: finalized.id,
        stripe_hosted_invoice_url: hostedUrl,
        invoice_sent_at: now,
      })
      .eq('id', meetingId);

    // Step 11: SMS
    await sendInvoiceSmses(
      meeting,
      profile,
      user,
      hostedUrl,
      meeting.quote_amount_cents ?? 0
    );

    return {
      invoice_id: finalized.id,
      hosted_url: hostedUrl,
      amount_cents: meeting.quote_amount_cents ?? 0,
    };
  } catch (err) {
    console.error(`Invoice creation failed for meeting ${meetingId}:`, err);
    await revertToCompleted(meetingId);
    throw err;
  }
}

async function revertToCompleted(meetingId: string): Promise<void> {
  if (isDemo) {
    const m = demoStore.getMeetingById(meetingId);
    if (m && m.stripe_invoice_id == null) {
      demoStore.updateMeeting(meetingId, { status: 'completed' });
    }
    return;
  }
  const supabase = createServerClient();
  await supabase
    .from('meetings')
    .update({ status: 'completed' })
    .eq('id', meetingId)
    .is('stripe_invoice_id', null);
}
