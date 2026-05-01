import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { refreshAccountStatus } from '@/lib/stripe-connect';
import { ownerDisplayName } from '@/lib/owner-display';
import { formatDollars, formatShortDay, formatTime } from '@/lib/utils';
import { sendEmail, smsBodyToHtml } from '@/lib/email';
import { createServerClient } from '@/lib/supabase';
import { User, Profile } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 });
  }

  try {
    await handleEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleEvent(event: Stripe.Event) {
  const supabase = createServerClient();

  switch (event.type) {
    case 'account.updated': {
      // event.account is the connected account ID for Connect events
      const accountId = event.account;
      if (!accountId) break;
      const { data: sa } = await supabase
        .from('stripe_accounts')
        .select('user_phone')
        .eq('stripe_account_id', accountId)
        .maybeSingle();
      if (sa?.user_phone) {
        await refreshAccountStatus(sa.user_phone);
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const { data: meeting } = await supabase
        .from('meetings')
        .select('*')
        .eq('stripe_invoice_id', invoice.id)
        .maybeSingle();
      if (!meeting) break;
      if (meeting.status === 'paid') break; // already handled — idempotent

      const { data: updated } = await supabase
        .from('meetings')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', meeting.id)
        .eq('status', 'invoiced')
        .select('id');

      if ((updated?.length ?? 0) > 0) {
        const [{ data: userData }, { data: profileData }] = await Promise.all([
          supabase.from('users').select('*').eq('phone', meeting.user_phone).single(),
          supabase.from('profiles').select('*').eq('user_phone', meeting.user_phone).maybeSingle(),
        ]);
        const user = userData as User;
        const profile = profileData as Profile | null;
        const ownerName = ownerDisplayName(profile, user);
        const amount = formatDollars(meeting.quote_amount_cents ?? 0);
        const shortDate = formatShortDay(meeting.meeting_date);
        const time = formatTime(meeting.start_time);

        const visitorEmail: string | null = (meeting as { visitor_email?: string | null }).visitor_email ?? null;
        const ownerEmail: string | null = (user as { email?: string | null }).email ?? null;
        const paidCustomerText = `Payment confirmed — thanks for booking with ${ownerName}!`;
        const paidOwnerText = `Payment received: $${amount} from ${meeting.visitor_name} for ${shortDate} ${time}. Funds arrive in your bank in ~2 business days.`;
        try {
          if (visitorEmail) await sendEmail({ to: visitorEmail, subject: 'Payment confirmed', text: paidCustomerText, html: smsBodyToHtml(paidCustomerText) });
        } catch (err) {
          console.error('Failed to send payment-confirmed email to customer:', err);
        }
        try {
          if (ownerEmail) await sendEmail({ to: ownerEmail, subject: `Payment received from ${meeting.visitor_name}`, text: paidOwnerText, html: smsBodyToHtml(paidOwnerText) });
        } catch (err) {
          console.error('Failed to send payment-received email to owner:', err);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const { data: meeting } = await supabase
        .from('meetings')
        .select('*')
        .eq('stripe_invoice_id', invoice.id)
        .maybeSingle();
      if (!meeting || meeting.status !== 'invoiced') break;

      // Rate-limit: don't re-notify within 24h
      if (meeting.payment_failure_notified_at) {
        const lastNotified = new Date(meeting.payment_failure_notified_at).getTime();
        if (Date.now() - lastNotified < 24 * 60 * 60 * 1000) break;
      }

      const failedVisitorEmail: string | null = (meeting as { visitor_email?: string | null }).visitor_email ?? null;
      try {
        if (failedVisitorEmail) {
          const failText = `Your payment didn't go through. Try again: ${meeting.stripe_hosted_invoice_url}`;
          await sendEmail({ to: failedVisitorEmail, subject: 'Payment failed — action required', text: failText, html: smsBodyToHtml(failText) });
        }
      } catch (err) {
        console.error('Failed to send payment-failed email:', err);
      }
      await supabase
        .from('meetings')
        .update({ payment_failure_notified_at: new Date().toISOString() })
        .eq('id', meeting.id);
      break;
    }

    case 'invoice.finalization_failed': {
      const invoice = event.data.object as Stripe.Invoice & {
        last_finalization_error?: unknown;
      };
      console.error(
        `Invoice finalization failed — invoice: ${invoice.id}, error:`,
        invoice.last_finalization_error
      );
      break;
    }

    default:
      // Unhandled — return 200 so Stripe doesn't retry
      break;
  }
}
