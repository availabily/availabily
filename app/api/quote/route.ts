import { NextRequest, NextResponse } from 'next/server';
import { getMeetingByQuoteToken, getOwnerForMeeting } from '@/lib/meeting-lookup';
import { demoStore } from '@/lib/demo-store';
import { createServerClient } from '@/lib/supabase';
import { sendEmail, smsBodyToHtml } from '@/lib/email';
import { formatAmountCents, formatShortDate, formatTime } from '@/lib/utils';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface QuoteBody {
  token: string;
  amount_cents: number;
  description?: string;
}

export async function POST(request: NextRequest) {
  let body: QuoteBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { token, amount_cents, description } = body;

  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  if (!Number.isInteger(amount_cents) || amount_cents < 100 || amount_cents > 10_000_000) {
    return NextResponse.json(
      { error: 'amount_cents must be an integer between 100 ($1) and 10000000 ($100k)' },
      { status: 400 },
    );
  }
  if (description !== undefined && (typeof description !== 'string' || description.length > 200)) {
    return NextResponse.json({ error: 'description must be a string ≤ 200 characters' }, { status: 400 });
  }

  const meeting = await getMeetingByQuoteToken(token);
  if (!meeting) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (meeting.status !== 'pending') {
    return NextResponse.json({ error: 'Already handled', status: meeting.status }, { status: 409 });
  }

  const quotedAt = new Date().toISOString();
  const descriptionValue = description?.trim() || '';

  if (isDemo) {
    demoStore.updateMeeting(meeting.id, {
      status: 'quoted',
      quote_amount_cents: amount_cents,
      quote_description: descriptionValue,
      quoted_at: quotedAt,
    });
  } else {
    const supabase = createServerClient();
    const { data: updated } = await supabase
      .from('meetings')
      .update({
        status: 'quoted',
        quote_amount_cents: amount_cents,
        quote_description: descriptionValue,
        quoted_at: quotedAt,
      })
      .eq('id', meeting.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();

    if (!updated) {
      const { data: current } = await supabase
        .from('meetings')
        .select('status')
        .eq('id', meeting.id)
        .single();
      return NextResponse.json(
        { error: 'Already handled', status: current?.status },
        { status: 409 },
      );
    }
  }

  const { user, profile } = await getOwnerForMeeting(meeting);
  const ownerDisplayName =
    profile?.business_name || profile?.display_name || `@${user.handle}`;
  const shortDate = formatShortDate(meeting.meeting_date);
  const time = formatTime(meeting.start_time);
  const amountFormatted = formatAmountCents(amount_cents);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';

  const emailBody = [
    `${ownerDisplayName} sent you a quote for ${shortDate} ${time}:`,
    `${amountFormatted}${descriptionValue ? ' — ' + descriptionValue : ''}`,
    `Review & accept: ${baseUrl}/a/${meeting.accept_token}`,
  ].join('\n');

  const visitorEmail: string | null = (meeting as { visitor_email?: string | null }).visitor_email ?? null;
  try {
    if (visitorEmail) {
      await sendEmail({ to: visitorEmail, subject: `Quote from ${ownerDisplayName}: ${amountFormatted}`, text: emailBody, html: smsBodyToHtml(emailBody) });
    } else {
      console.warn('[email] visitor_email not set for meeting', meeting.id);
    }
  } catch (err) {
    console.error('Failed to send quote email:', err);
  }

  return NextResponse.json({ success: true });
}
