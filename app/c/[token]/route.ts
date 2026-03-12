import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { formatFullDay, formatTime } from '@/lib/utils';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

function confirmedPage(visitorName: string, dayName: string, time: string): NextResponse {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Meeting Confirmed</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8fafc; }
    .card { background: #fff; border-radius: 16px; padding: 40px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #16a34a; font-size: 1.75rem; margin-bottom: 8px; }
    p { color: #475569; margin: 8px 0; }
    .time { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 16px 0; }
    a { display: inline-block; margin-top: 24px; background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:3rem;">✅</div>
    <h1>Confirmed!</h1>
    <p>You confirmed the meeting with <strong>${visitorName}</strong>.</p>
    <p class="time">${dayName} at ${time}</p>
    <p>Contact them to let them know you're confirmed.</p>
    <a href="/dashboard">View dashboard →</a>
  </div>
</body>
</html>`;
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html' } });
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
      return new NextResponse(
        `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>Not Found</h1><p>This confirmation link is invalid.</p></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html' } }
      );
    }
    if (meeting.status !== 'pending') {
      const messages: Record<string, string> = {
        accepted: 'This meeting has already been confirmed.',
        declined: 'This meeting has already been declined.',
        expired: 'This meeting request has expired.',
      };
      const message = messages[meeting.status] || 'This request has already been handled.';
      return new NextResponse(
        `<!DOCTYPE html><html><head><title>Already Handled</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>Already Handled</h1><p>${message}</p></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }
    const createdAt = new Date(meeting.created_at);
    if (createdAt < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      demoStore.updateMeeting(meeting.id, { status: 'expired' });
      return new NextResponse(
        `<!DOCTYPE html><html><head><title>Expired</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>Request Expired</h1><p>This request has expired. Time slots expire after 24 hours.</p></body></html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
      );
    }
    demoStore.updateMeeting(meeting.id, { status: 'accepted' });
    const dayName = formatFullDay(meeting.meeting_date);
    const time = formatTime(meeting.start_time);
    return confirmedPage(meeting.visitor_name, dayName, time);
  }

  // ── Production: use Supabase ──
  const supabase = createServerClient();

  // Find meeting by confirm_token
  const { data: meeting, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('confirm_token', token)
    .single();

  if (error || !meeting) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>Not Found</h1><p>This confirmation link is invalid.</p></body></html>`,
      { status: 404, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Check if already handled
  if (meeting.status !== 'pending') {
    const messages: Record<string, string> = {
      accepted: 'This meeting has already been confirmed.',
      declined: 'This meeting has already been declined.',
      expired: 'This meeting request has expired.',
    };
    const message = messages[meeting.status] || 'This request has already been handled.';
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Already Handled</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>Already Handled</h1><p>${message}</p></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Check if expired (older than 24 hours)
  const createdAt = new Date(meeting.created_at);
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (createdAt < twentyFourHoursAgo) {
    await supabase
      .from('meetings')
      .update({ status: 'expired' })
      .eq('id', meeting.id);

    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Expired</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>Request Expired</h1><p>This request has expired. Time slots expire after 24 hours.</p></body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Accept the meeting
  const { error: updateError } = await supabase
    .from('meetings')
    .update({ status: 'accepted' })
    .eq('id', meeting.id);

  if (updateError) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Error</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>Error</h1><p>Failed to confirm meeting. Please try again.</p></body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }

  const dayName = formatFullDay(meeting.meeting_date);
  const time = formatTime(meeting.start_time);
  return confirmedPage(meeting.visitor_name, dayName, time);
}
