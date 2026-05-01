import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { isDemo } from '@/lib/stripe';
import { createInvoiceForMeeting } from '@/lib/stripe-invoices';
import { ownerDisplayName } from '@/lib/owner-display';
import { formatDollars, formatShortDay } from '@/lib/utils';
import { sendEmail, smsBodyToHtml } from '@/lib/email';
import { Meeting, User, Profile } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    completed: 0,
    invoiced: 0,
    invoice_failures: [] as { meeting_id: string; error: string }[],
    reminded: 0,
  };

  if (isDemo) {
    return runDemoCron(results);
  }

  const supabase = createServerClient();

  // ── Phase A: confirmed → completed ────────────────────────────────────────
  const { data: promoted } = await supabase
    .from('meetings')
    .update({ status: 'completed' })
    .eq('status', 'confirmed')
    .lt('ends_at', new Date().toISOString())
    .gt('ends_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .select('id');

  results.completed = promoted?.length ?? 0;

  // ── Phase B: completed → invoiced ─────────────────────────────────────────
  const { data: toInvoice } = await supabase
    .from('meetings')
    .select('*')
    .eq('status', 'completed')
    .is('stripe_invoice_id', null)
    .gt('ends_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(50);

  for (const row of toInvoice ?? []) {
    try {
      await createInvoiceForMeeting(row.id);
      results.invoiced++;
    } catch (err) {
      if (err instanceof Error && err.message === 'meeting not claimable') continue;
      results.invoice_failures.push({
        meeting_id: row.id,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error(`Invoice failed for meeting ${row.id}:`, err);
    }
  }

  // ── Phase C: payment reminders ────────────────────────────────────────────
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const { data: toRemind } = await supabase
    .from('meetings')
    .select('*')
    .eq('status', 'invoiced')
    .is('paid_at', null)
    .is('reminder_sent_at', null)
    .lt('invoice_sent_at', threeDaysAgo)
    .gt('invoice_sent_at', fourteenDaysAgo)
    .limit(50);

  for (const row of toRemind ?? []) {
    try {
      await sendReminderEmail(row as Meeting);
      await supabase
        .from('meetings')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', row.id);
      results.reminded++;
    } catch (err) {
      console.error(`Reminder failed for meeting ${row.id}:`, err);
    }
  }

  return NextResponse.json(results);
}

async function sendReminderEmail(meeting: Meeting): Promise<void> {
  const visitorEmail: string | null = (meeting as { visitor_email?: string | null }).visitor_email ?? null;
  if (!visitorEmail) {
    console.warn('[email] visitor_email not set for reminder, meeting', meeting.id);
    return;
  }
  const supabase = createServerClient();
  const [{ data: userData }, { data: profileData }] = await Promise.all([
    supabase.from('users').select('*').eq('phone', meeting.user_phone).single(),
    supabase.from('profiles').select('*').eq('user_phone', meeting.user_phone).maybeSingle(),
  ]);
  const user = userData as User;
  const profile = profileData as Profile | null;
  const ownerName = ownerDisplayName(profile, user);
  const shortDate = formatShortDay(meeting.meeting_date);
  const amount = formatDollars(meeting.quote_amount_cents ?? 0);
  const body = `Reminder: invoice for ${shortDate} appointment with ${ownerName} — $${amount}. Pay here: ${meeting.stripe_hosted_invoice_url}`;
  await sendEmail({ to: visitorEmail, subject: `Payment reminder: invoice for ${shortDate}`, text: body, html: smsBodyToHtml(body) });
}

async function runDemoCron(
  results: {
    completed: number;
    invoiced: number;
    invoice_failures: { meeting_id: string; error: string }[];
    reminded: number;
  }
) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Phase A
  const allMeetings = demoStore.getAllMeetings();
  for (const m of allMeetings) {
    if (m.status === 'confirmed' && m.ends_at) {
      const endsAt = new Date(m.ends_at);
      if (endsAt < now && endsAt > thirtyDaysAgo) {
        demoStore.updateMeeting(m.id, { status: 'completed' });
        results.completed++;
      }
    }
  }

  // Phase B — re-read after phase A mutations
  for (const m of demoStore.getAllMeetings()) {
    if (m.status === 'completed' && m.stripe_invoice_id == null && m.ends_at) {
      const endsAt = new Date(m.ends_at);
      if (endsAt > sevenDaysAgo) {
        try {
          await createInvoiceForMeeting(m.id);
          results.invoiced++;
        } catch (err) {
          if (err instanceof Error && err.message === 'meeting not claimable') continue;
          results.invoice_failures.push({
            meeting_id: m.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }
  }

  // Phase C
  for (const m of demoStore.getAllMeetings()) {
    if (
      m.status === 'invoiced' &&
      m.paid_at == null &&
      m.reminder_sent_at == null &&
      m.invoice_sent_at
    ) {
      const sentAt = new Date(m.invoice_sent_at);
      if (sentAt < threeDaysAgo && sentAt > fourteenDaysAgo) {
        try {
          const user = demoStore.getUserByPhone(m.user_phone);
          const profile = demoStore.getProfile(m.user_phone);
          if (!user) continue;
          const ownerName = ownerDisplayName(profile, user);
          const shortDate = formatShortDay(m.meeting_date);
          const amount = formatDollars(m.quote_amount_cents ?? 0);
          const body = `Reminder: invoice for ${shortDate} appointment with ${ownerName} — $${amount}. Pay here: ${m.stripe_hosted_invoice_url}`;
          const visitorEmail: string | null = (m as { visitor_email?: string | null }).visitor_email ?? null;
          if (visitorEmail) {
            await sendEmail({ to: visitorEmail, subject: `Payment reminder: invoice for ${shortDate}`, text: body, html: smsBodyToHtml(body) });
          }
          demoStore.updateMeeting(m.id, { reminder_sent_at: new Date().toISOString() });
          results.reminded++;
        } catch (err) {
          console.error(`Demo reminder failed for meeting ${m.id}:`, err);
        }
      }
    }
  }

  return NextResponse.json(results);
}

