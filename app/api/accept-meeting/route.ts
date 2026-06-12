import { NextRequest, NextResponse } from 'next/server';
import { getMeetingByQuoteToken, getOwnerForMeeting } from '@/lib/meeting-lookup';
import { demoStore } from '@/lib/demo-store';
import { createServerClient } from '@/lib/supabase';
import { sendEmail, smsBodyToHtml } from '@/lib/email';
import { ownerDisplayName } from '@/lib/owner-display';
import { formatShortDate, formatTime } from '@/lib/utils';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface AcceptMeetingBody {
  token: string; // the owner's quote_token
}

// Owner accepts a pending booking as a Consultation / Meeting: no quote, no
// invoice, no payment. The booking is confirmed directly (slot stays blocked)
// and reuses the existing confirmed → completed path.
export async function POST(request: NextRequest) {
  let body: AcceptMeetingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token } = body;
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const meeting = await getMeetingByQuoteToken(token);
  if (!meeting) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Idempotency: already accepted as a consultation.
  if (meeting.status === 'confirmed' && meeting.booking_type === 'consultation') {
    return NextResponse.json({ success: true, already: true });
  }
  if (meeting.status !== 'pending') {
    return NextResponse.json({ error: 'Already handled', status: meeting.status }, { status: 409 });
  }

  const now = new Date().toISOString();

  if (isDemo) {
    demoStore.updateMeeting(meeting.id, {
      status: 'confirmed',
      booking_type: 'consultation',
      customer_confirmed_at: now,
    });
  } else {
    const supabase = createServerClient();
    const { data: updated } = await supabase
      .from('meetings')
      .update({ status: 'confirmed', booking_type: 'consultation', customer_confirmed_at: now })
      .eq('id', meeting.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (!updated) {
      const { data: current } = await supabase
        .from('meetings')
        .select('status, booking_type')
        .eq('id', meeting.id)
        .single();
      if (current?.status === 'confirmed' && current?.booking_type === 'consultation') {
        return NextResponse.json({ success: true, already: true });
      }
      return NextResponse.json({ error: 'Already handled', status: current?.status }, { status: 409 });
    }
  }

  // Notify both parties — no payment wording (this is a free meeting). The
  // customer hasn't acted since the original request, so this is their first
  // confirmation.
  try {
    const { user, profile } = await getOwnerForMeeting(meeting);
    const ownerName = ownerDisplayName(profile, user);
    const shortDate = formatShortDate(meeting.meeting_date);
    const time = formatTime(meeting.start_time);
    const ownerEmail: string | null = user.email ?? null;
    const visitorEmail: string | null = meeting.visitor_email ?? null;

    const customerText = `✓ Your meeting with ${ownerName} is confirmed for ${shortDate} ${time}. No payment needed — see you then.`;
    const ownerText = `✓ You confirmed a ${shortDate} ${time} meeting with ${meeting.visitor_name}. This is a consultation — no quote or payment.`;

    await Promise.all([
      visitorEmail
        ? sendEmail({ to: visitorEmail, subject: `Meeting confirmed with ${ownerName}`, text: customerText, html: smsBodyToHtml(customerText) })
        : Promise.resolve(),
      ownerEmail
        ? sendEmail({ to: ownerEmail, subject: `Consultation confirmed with ${meeting.visitor_name}`, text: ownerText, html: smsBodyToHtml(ownerText) })
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.error('Failed to send consultation confirmation emails:', err);
  }

  return NextResponse.json({ success: true });
}
