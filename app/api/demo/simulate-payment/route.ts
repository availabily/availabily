import { NextRequest, NextResponse } from 'next/server';
import { notFound } from 'next/navigation';
import { demoStore } from '@/lib/demo-store';
import { ownerDisplayName } from '@/lib/owner-display';
import { formatDollars, formatShortDay, formatTime } from '@/lib/utils';
import { sendSMS } from '@/lib/twilio';
import { User, Profile } from '@/lib/types';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function POST(request: NextRequest) {
  if (!isDemo) return notFound();

  let meetingId: string;
  let action: string;

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    meetingId = body.meeting_id;
    action = body.action;
  } else {
    const form = await request.formData();
    meetingId = form.get('meeting_id') as string;
    action = form.get('action') as string;
  }

  if (!meetingId || !['succeed', 'fail'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
  }

  const meeting = demoStore.getMeetingById(meetingId);
  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const user = demoStore.getUserByPhone(meeting.user_phone) as User | null;
  const profile = demoStore.getProfile(meeting.user_phone) as Profile | null;
  if (!user) return NextResponse.json({ error: 'Owner not found' }, { status: 404 });

  const ownerName = ownerDisplayName(profile, user);
  const amount = formatDollars(meeting.quote_amount_cents ?? 0);
  const shortDate = formatShortDay(meeting.meeting_date);
  const time = formatTime(meeting.start_time);

  if (action === 'succeed') {
    if (meeting.status === 'paid') {
      // Idempotent — redirect back to invoice
      return NextResponse.redirect(new URL(`/demo/invoice/${meetingId}`, request.url), 303);
    }
    if (meeting.status !== 'invoiced') {
      return NextResponse.json({ error: 'Meeting not invoiced' }, { status: 409 });
    }

    demoStore.updateMeeting(meetingId, {
      status: 'paid',
      paid_at: new Date().toISOString(),
    });

    try {
      await sendSMS(
        meeting.visitor_phone,
        `Payment confirmed — thanks for booking with ${ownerName}!`
      );
    } catch (err) {
      console.error('Sim: failed to send customer paid SMS:', err);
    }
    try {
      await sendSMS(
        meeting.user_phone,
        `Payment received: $${amount} from ${meeting.visitor_name} for ${shortDate} ${time}. Funds arrive in your bank in ~2 business days.`
      );
    } catch (err) {
      console.error('Sim: failed to send owner paid SMS:', err);
    }

    return NextResponse.redirect(new URL(`/demo/invoice/${meetingId}`, request.url), 303);
  }

  // action === 'fail'
  if (meeting.status !== 'invoiced') {
    return NextResponse.json({ error: 'Meeting not invoiced' }, { status: 409 });
  }

  // Rate-limit: don't re-notify within 24h
  if (meeting.payment_failure_notified_at) {
    const lastNotified = new Date(meeting.payment_failure_notified_at).getTime();
    if (Date.now() - lastNotified < 24 * 60 * 60 * 1000) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'rate-limited' });
    }
  }

  try {
    await sendSMS(
      meeting.visitor_phone,
      `Your payment didn't go through. Try again: ${meeting.stripe_hosted_invoice_url}`
    );
  } catch (err) {
    console.error('Sim: failed to send payment-failed SMS:', err);
  }

  demoStore.updateMeeting(meetingId, {
    payment_failure_notified_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, action: 'fail', notified: true });
}
