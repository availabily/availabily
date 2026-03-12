import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { formatFullDay, formatTime, formatDateDisplay } from '@/lib/utils';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

function confirmationPage(
  visitorName: string,
  visitorPhone: string,
  meetingDate: string,
  startTime: string
): string {
  const dayName = formatFullDay(meetingDate);
  const time = formatTime(startTime);
  const displayDate = formatDateDisplay(meetingDate);
  const smsBody = `Confirmed for ${dayName} at ${time}`;
  const smsUrl = `sms:${visitorPhone}?body=${encodeURIComponent(smsBody)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Meeting Confirmed — AM or PM?</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 24px rgba(0,0,0,0.06); padding: 48px 40px; max-width: 420px; width: 100%; text-align: center; }
    .emoji { font-size: 56px; margin-bottom: 20px; }
    h1 { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 8px; }
    .subtitle { color: #64748b; font-size: 15px; margin-bottom: 28px; }
    .details { background: #f1f5f9; border-radius: 16px; padding: 20px; margin-bottom: 28px; text-align: left; }
    .details p { color: #475569; font-size: 14px; margin-bottom: 6px; }
    .details p:last-child { margin-bottom: 0; }
    .details strong { color: #1e293b; }
    .btn { display: inline-block; background: #4f46e5; color: #fff; font-weight: 600; font-size: 15px; padding: 14px 28px; border-radius: 14px; text-decoration: none; margin-bottom: 12px; width: 100%; }
    .btn-secondary { display: inline-block; color: #64748b; font-size: 13px; text-decoration: none; }
    .btn-secondary:hover { color: #4f46e5; }
    .logo { font-size: 18px; font-weight: 800; margin-bottom: 32px; display: block; }
    .logo span { color: #4f46e5; }
  </style>
</head>
<body>
  <div class="card">
    <a href="/" class="logo"><span>AM</span> or <span>PM?</span></a>
    <div class="emoji">✅</div>
    <h1>Meeting Confirmed!</h1>
    <p class="subtitle">You've confirmed the booking with ${visitorName}.</p>
    <div class="details">
      <p><strong>${visitorName}</strong></p>
      <p>${displayDate}</p>
      <p>at ${time}</p>
    </div>
    <a href="/dashboard" class="btn">Go to Dashboard →</a>
    <br />
    <a href="${smsUrl}" class="btn-secondary">Send confirmation text to visitor</a>
  </div>
</body>
</html>`;
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
    return new NextResponse(
      confirmationPage(meeting.visitor_name, meeting.visitor_phone, meeting.meeting_date, meeting.start_time),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
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

  return new NextResponse(
    confirmationPage(meeting.visitor_name, meeting.visitor_phone, meeting.meeting_date, meeting.start_time),
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
