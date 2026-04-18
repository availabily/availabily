import { NextRequest, NextResponse } from 'next/server';
import { getMeetingByAcceptToken, getOwnerForMeeting } from '@/lib/meeting-lookup';
import { demoStore } from '@/lib/demo-store';
import { createServerClient } from '@/lib/supabase';
import { sendSMS } from '@/lib/twilio';
import { formatShortDate, formatTime } from '@/lib/utils';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface AcceptBody {
  token: string;
  action: 'accept' | 'decline';
}

export async function POST(request: NextRequest) {
  let body: AcceptBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token, action } = body;
  if (!token || (action !== 'accept' && action !== 'decline')) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
  }

  const meeting = await getMeetingByAcceptToken(token);
  if (!meeting) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Idempotency: already in target state
  if (action === 'accept' && meeting.status === 'confirmed') {
    return NextResponse.json({ success: true, already: true });
  }
  if (action === 'decline' && meeting.status === 'declined') {
    return NextResponse.json({ success: true, already: true });
  }

  if (meeting.status !== 'quoted') {
    return NextResponse.json(
      { error: 'Cannot accept/decline in current state', status: meeting.status },
      { status: 409 },
    );
  }

  const { user, profile } = await getOwnerForMeeting(meeting);
  const ownerName = profile?.business_name || profile?.display_name || `@${user.handle}`;
  const shortDate = formatShortDate(meeting.meeting_date);
  const time = formatTime(meeting.start_time);
  const now = new Date().toISOString();

  if (action === 'accept') {
    if (isDemo) {
      demoStore.updateMeeting(meeting.id, { status: 'confirmed', customer_confirmed_at: now });
    } else {
      const supabase = createServerClient();
      const { data: updated } = await supabase
        .from('meetings')
        .update({ status: 'confirmed', customer_confirmed_at: now })
        .eq('id', meeting.id)
        .eq('status', 'quoted')
        .select('id')
        .maybeSingle();

      if (!updated) {
        // Race: re-check for idempotency
        const { data: current } = await supabase
          .from('meetings')
          .select('status')
          .eq('id', meeting.id)
          .single();
        if (current?.status === 'confirmed') {
          return NextResponse.json({ success: true, already: true });
        }
        return NextResponse.json(
          { error: 'State changed concurrently', status: current?.status },
          { status: 409 },
        );
      }
    }

    try {
      await Promise.all([
        sendSMS(
          user.phone,
          `✓ ${meeting.visitor_name} accepted your quote for ${shortDate} ${time}. You'll get an invoice to send after the appointment.`,
        ),
        sendSMS(
          meeting.visitor_phone,
          `✓ Booking confirmed with ${ownerName} for ${shortDate} ${time}. You'll receive an invoice after your appointment.`,
        ),
      ]);
    } catch (err) {
      console.error('Failed to send accept SMSes:', err);
    }
  } else {
    // decline
    if (isDemo) {
      demoStore.updateMeeting(meeting.id, { status: 'declined' });
    } else {
      const supabase = createServerClient();
      await supabase
        .from('meetings')
        .update({ status: 'declined' })
        .eq('id', meeting.id)
        .eq('status', 'quoted');
    }

    try {
      await sendSMS(
        user.phone,
        `${meeting.visitor_name} declined your quote for ${shortDate} ${time}.`,
      );
    } catch (err) {
      console.error('Failed to send decline SMS:', err);
    }
  }

  return NextResponse.json({ success: true });
}
