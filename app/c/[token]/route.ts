import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { formatFullDay, formatTime } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
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

  // Redirect to SMS app with prewritten message
  const dayName = formatFullDay(meeting.meeting_date);
  const time = formatTime(meeting.start_time);
  const smsBody = `Confirmed for ${dayName} at ${time}`;
  const smsUrl = `sms:${meeting.visitor_phone}?body=${encodeURIComponent(smsBody)}`;

  return NextResponse.redirect(smsUrl, 302);
}
