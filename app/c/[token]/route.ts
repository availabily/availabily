import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { formatFullDay, formatTime } from '@/lib/utils';
import { nanoid } from 'nanoid';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

function confirmationPage(dayName: string, time: string, visitorPhone: string, visitorName: string): NextResponse {
  const smsUrl = `sms:${visitorPhone}?body=${encodeURIComponent(`Confirmed for ${dayName} at ${time}`)}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meeting Confirmed — AM or PM?</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #f8faff 0%, #eef2ff 50%, #f5f3ff 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .card { background: #fff; border-radius: 1.5rem; box-shadow: 0 4px 24px rgba(79,70,229,0.08); max-width: 440px; width: 100%; padding: 2.5rem; text-align: center; }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    h1 { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .subtitle { color: #64748b; font-size: 1rem; margin-bottom: 1.5rem; }
    .detail { background: #f1f5f9; border-radius: 1rem; padding: 1rem 1.5rem; margin-bottom: 1.5rem; font-size: 1rem; color: #334155; }
    .detail strong { display: block; font-size: 1.15rem; color: #1e293b; margin-top: 0.25rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.875rem 1.75rem; border-radius: 0.875rem; font-weight: 600; font-size: 1rem; text-decoration: none; transition: all 0.15s; cursor: pointer; border: none; }
    .btn-primary { background: #4f46e5; color: #fff; width: 100%; margin-bottom: 0.75rem; }
    .btn-primary:hover { background: #4338ca; }
    .btn-secondary { background: #f1f5f9; color: #475569; width: 100%; font-size: 0.9rem; }
    .btn-secondary:hover { background: #e2e8f0; }
    .brand { margin-top: 2rem; font-size: 0.85rem; color: #94a3b8; }
    .brand span { color: #4f46e5; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Meeting Confirmed!</h1>
    <p class="subtitle">You've confirmed the appointment with ${visitorName}.</p>
    <div class="detail">
      Scheduled for<strong>${dayName} at ${time}</strong>
    </div>
    <a href="/dashboard" class="btn btn-primary">Go to Dashboard</a>
    <a href="${smsUrl}" class="btn btn-secondary">📱 Send confirmation text</a>
    <p class="brand"><span>AM</span> or <span>PM?</span> · Simple scheduling</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
}

function statusPage(title: string, message: string, status: number = 200): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — AM or PM?</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #f8faff 0%, #eef2ff 50%, #f5f3ff 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .card { background: #fff; border-radius: 1.5rem; box-shadow: 0 4px 24px rgba(79,70,229,0.08); max-width: 440px; width: 100%; padding: 2.5rem; text-align: center; }
    h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; }
    p { color: #64748b; }
    .brand { margin-top: 2rem; font-size: 0.85rem; color: #94a3b8; }
    .brand span { color: #4f46e5; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
    <p class="brand"><span>AM</span> or <span>PM?</span> · Simple scheduling</p>
  </div>
</body>
</html>`;
  return new NextResponse(html, { status, headers: { 'Content-Type': 'text/html' } });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // ── Demo mode: use in-memory store ──
  if (isDemo) {
    const meeting = demoStore.getMeetingByToken(token);
    if (!meeting) {
      return statusPage('Not Found', 'This confirmation link is invalid.', 404);
    }
    if (meeting.status !== 'pending') {
      const messages: Record<string, string> = {
        accepted: 'This meeting has already been confirmed.',
        declined: 'This meeting has already been declined.',
        expired: 'This meeting request has expired.',
      };
      return statusPage('Already Handled', messages[meeting.status] || 'This request has already been handled.');
    }
    const createdAt = new Date(meeting.created_at);
    if (createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      demoStore.updateMeeting(meeting.id, { status: 'expired' });
      return statusPage('Request Expired', 'This request has expired. Time slots expire after 24 hours.');
    }
    demoStore.updateMeeting(meeting.id, { status: 'accepted' });

    // Create booking_confirmed notification
    demoStore.createNotification({
      id: `notif-${nanoid(8)}`,
      user_phone: meeting.user_phone,
      type: 'booking_confirmed',
      title: 'Booking confirmed',
      body: `Meeting with ${meeting.visitor_name} confirmed for ${formatFullDay(meeting.meeting_date)} at ${formatTime(meeting.start_time)}`,
      link: null,
      read: false,
      created_at: new Date().toISOString(),
    });

    return confirmationPage(
      formatFullDay(meeting.meeting_date),
      formatTime(meeting.start_time),
      meeting.visitor_phone,
      meeting.visitor_name
    );
  }

  // ── Production: use Supabase ──
  const supabase = createServerClient();

  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('confirm_token', token)
    .single();

  if (error || !meeting) {
    return statusPage('Not Found', 'This confirmation link is invalid.', 404);
  }

  if (meeting.status !== 'pending') {
    const messages: Record<string, string> = {
      accepted: 'This meeting has already been confirmed.',
      declined: 'This meeting has already been declined.',
      expired: 'This meeting request has expired.',
    };
    return statusPage('Already Handled', messages[meeting.status] || 'This request has already been handled.');
  }

  const createdAt = new Date(meeting.created_at);
  if (createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    await supabase.from('meetings').update({ status: 'expired' }).eq('id', meeting.id);
    return statusPage('Request Expired', 'This request has expired. Time slots expire after 24 hours.');
  }

  const { error: updateError } = await supabase
    .from('meetings')
    .update({ status: 'accepted' })
    .eq('id', meeting.id);

  if (updateError) {
    return statusPage('Error', 'Failed to confirm meeting. Please try again.', 500);
  }

  // Create booking_confirmed notification
  await supabase.from('notifications').insert({
    user_phone: meeting.user_phone,
    type: 'booking_confirmed',
    title: 'Booking confirmed',
    body: `Meeting with ${meeting.visitor_name} confirmed for ${formatFullDay(meeting.meeting_date)} at ${formatTime(meeting.start_time)}`,
    link: null,
    read: false,
  });

  return confirmationPage(
    formatFullDay(meeting.meeting_date),
    formatTime(meeting.start_time),
    meeting.visitor_phone,
    meeting.visitor_name
  );
}

