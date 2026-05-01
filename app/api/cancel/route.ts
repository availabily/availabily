import { NextRequest, NextResponse } from 'next/server';
import { getMeetingByManageToken, getOwnerForMeeting } from '@/lib/meeting-lookup';
import { demoStore } from '@/lib/demo-store';
import { createServerClient } from '@/lib/supabase';
import { sendEmail, smsBodyToHtml } from '@/lib/email';
import { formatShortDate, formatTime } from '@/lib/utils';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
const CANCELLABLE = new Set(['pending', 'quoted', 'confirmed'] as const);

interface CancelBody {
  token: string;
  reason?: string;
}

export async function POST(request: NextRequest) {
  let body: CancelBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token, reason } = body;
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const meeting = await getMeetingByManageToken(token);
  if (!meeting) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!CANCELLABLE.has(meeting.status as 'pending' | 'quoted' | 'confirmed')) {
    return NextResponse.json(
      { error: 'Cannot cancel in current state', status: meeting.status },
      { status: 409 },
    );
  }

  const cancelledAt = new Date().toISOString();
  const reasonValue = reason?.trim() || null;

  if (isDemo) {
    demoStore.updateMeeting(meeting.id, {
      status: 'cancelled',
      cancelled_at: cancelledAt,
      cancellation_reason: reasonValue,
    });
  } else {
    const supabase = createServerClient();
    await supabase
      .from('meetings')
      .update({ status: 'cancelled', cancelled_at: cancelledAt, cancellation_reason: reasonValue })
      .eq('id', meeting.id);
  }

  const { user, profile } = await getOwnerForMeeting(meeting);
  const ownerName = profile?.business_name || profile?.display_name || `@${user.handle}`;
  const shortDate = formatShortDate(meeting.meeting_date);
  const time = formatTime(meeting.start_time);

  const smsTail = reasonValue ? ` Reason: ${reasonValue}` : '';
  const cancelText = `Your booking with ${ownerName} for ${shortDate} ${time} has been cancelled.${smsTail}`;
  const visitorEmail: string | null = (meeting as { visitor_email?: string | null }).visitor_email ?? null;
  try {
    if (visitorEmail) {
      await sendEmail({ to: visitorEmail, subject: `Booking cancelled with ${ownerName}`, text: cancelText, html: smsBodyToHtml(cancelText) });
    }
  } catch (err) {
    console.error('Failed to send cancel email:', err);
  }

  return NextResponse.json({ success: true });
}
