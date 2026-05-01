import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { sendEmail, smsBodyToHtml } from '@/lib/email';
import { formatFullDay, formatTime } from '@/lib/utils';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  let meeting;

  if (isDemo) {
    meeting = demoStore.getMeetingByConfirmToken(token);
    if (!meeting) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    demoStore.updateMeeting(meeting.id, { status: 'confirmed' });
  } else {
    const supabase = createServerClient();
    const { data: meetingData } = await supabase
      .from('meetings')
      .select('*')
      .eq('confirm_token', token)
      .single();
    if (!meetingData) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    meeting = meetingData;
    await supabase
      .from('meetings')
      .update({ status: 'confirmed' })
      .eq('id', meeting.id);
  }

  const dayName = formatFullDay(meeting.meeting_date);
  const time = formatTime(meeting.start_time);
  const emailBody = `Confirmed for ${dayName} at ${time}`;
  const visitorEmail: string | null = (meeting as { visitor_email?: string | null }).visitor_email ?? null;
  try {
    if (visitorEmail) {
      await sendEmail({
        to: visitorEmail,
        subject: `Booking confirmed: ${dayName} at ${time}`,
        text: emailBody,
        html: smsBodyToHtml(emailBody),
      });
    } else {
      console.warn('[email] visitor_email not set for meeting', meeting.id);
    }
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
  }
  return new NextResponse(
    `<!DOCTYPE html><html><head><title>Confirmed</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h1>Meeting Confirmed</h1><p>${meeting.visitor_name} has been notified by email for ${dayName} at ${time}.</p></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
