import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';

import { sendEmail, smsBodyToHtml } from '@/lib/email';
import { isSlotAvailable } from '@/lib/scheduling';
import { isValidE164, toE164, formatPhone, formatTime, formatShortDay, computeEndsAt } from '@/lib/utils';
import { generateToken } from '@/lib/tokens';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface RequestBody {
  handle: string;
  date: string;
  start_time: string;
  visitor_name: string;
  visitor_email: string;
  visitor_phone?: string;
  visitor_address?: string;
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { handle, date, start_time, visitor_name, visitor_email, visitor_phone: rawVisitorPhone, visitor_address } = body;

  if (!handle || !date || !start_time || !visitor_name || !visitor_email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate visitor email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitor_email)) {
    return NextResponse.json({ error: 'Invalid visitor email address' }, { status: 400 });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
  }

  // Validate time format
  if (!/^\d{2}:\d{2}$/.test(start_time)) {
    return NextResponse.json({ error: 'Invalid time format. Use HH:MM' }, { status: 400 });
  }

  // Normalize and validate visitor phone (optional)
  let visitor_phone: string | null = null;
  if (rawVisitorPhone) {
    visitor_phone = rawVisitorPhone.startsWith('+') ? rawVisitorPhone : toE164(rawVisitorPhone);
    if (!isValidE164(visitor_phone)) {
      return NextResponse.json({ error: 'Invalid visitor phone number' }, { status: 400 });
    }
  }

  // Validate address length
  if (visitor_address && visitor_address.length > 200) {
    return NextResponse.json({ error: 'Address is too long (max 200 characters)' }, { status: 400 });
  }

  // ── Demo mode: use in-memory store ──
  if (isDemo) {
    const user = demoStore.getUserByHandle(handle);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (visitor_phone && demoStore.countPendingMeetings(user.phone, visitor_phone, twentyFourHoursAgo) >= 3) {
      return NextResponse.json({ error: 'Too many pending requests.' }, { status: 429 });
    }

    const rules = demoStore.getTimeRules(user.phone);
    const meetings = demoStore.getMeetingsByDate(user.phone, date);
    if (!isSlotAvailable(date, start_time, rules, meetings, user.timezone)) {
      return NextResponse.json({ error: 'This time slot is no longer available' }, { status: 409 });
    }

    const [h, m] = start_time.split(':').map(Number);
    const end_time = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const confirm_token = generateToken();
    const quote_token = generateToken();
    const accept_token = generateToken();
    const manage_token = generateToken();
    const ends_at = computeEndsAt(date, end_time, user.timezone);
    const now = new Date().toISOString();

    demoStore.createMeeting({
      id: `meeting-${Math.random().toString(36).slice(2)}`,
      user_phone: user.phone,
      meeting_date: date,
      start_time,
      end_time,
      visitor_name,
      visitor_phone: visitor_phone ?? '',
      note: visitor_address ?? '',
      status: 'pending',
      confirm_token,
      created_at: now,
      quote_amount_cents: null,
      quote_currency: 'usd',
      quote_description: '',
      quote_token,
      accept_token,
      manage_token,
      quoted_at: null,
      customer_confirmed_at: null,
      cancelled_at: null,
      cancellation_reason: null,
      stripe_invoice_id: null,
      stripe_payment_intent_id: null,
      stripe_hosted_invoice_url: null,
      invoice_sent_at: null,
      paid_at: null,
      ends_at,
      payment_failure_notified_at: null,
      reminder_sent_at: null,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';
    const smsBody = [
      'New booking request',
      `${formatShortDay(date)} ${formatTime(start_time)}`,
      visitor_phone ? `${visitor_name} – ${formatPhone(visitor_phone)}` : visitor_name,
      visitor_address ? `Note: ${visitor_address}` : null,
      `Email: ${visitor_email}`,
      `Confirm: ${baseUrl}/c/${confirm_token}`,
    ].filter(Boolean).join('\n');
    const ownerEmail: string | null = (user as { email?: string | null }).email ?? null;
    if (!ownerEmail) {
      console.warn('[email] owner email not set for user', user.phone);
    } else {
      await sendEmail({ to: ownerEmail, subject: `New booking request from ${visitor_name}`, text: smsBody, html: smsBodyToHtml(smsBody) });
    }
    await sendEmail({ to: visitor_email, subject: 'Booking request received', text: `Your request for ${formatShortDay(date)} at ${formatTime(start_time)} has been received. You'll hear back soon.`, html: smsBodyToHtml(`Your request for ${formatShortDay(date)} at ${formatTime(start_time)} has been received. You'll hear back soon.`) });
    return NextResponse.json({ success: true });
  }

  // ── Production: use Supabase ──
  const supabase = createServerClient();

  // Look up user by handle
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('handle', handle)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Rate limiting: max 3 pending requests per visitor phone per owner
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  if (visitor_phone) {
    const { count: pendingCount } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })
      .eq('user_phone', user.phone)
      .eq('visitor_phone', visitor_phone)
      .eq('status', 'pending')
      .gte('created_at', twentyFourHoursAgo);

    if ((pendingCount ?? 0) >= 3) {
      return NextResponse.json({ error: 'Too many pending requests. Please wait for existing requests to be handled.' }, { status: 429 });
    }
  }

  // Fetch time rules
  const { data: rules } = await supabase
    .from('time_rules')
    .select('*')
    .eq('user_phone', user.phone);

  // Fetch relevant meetings
  const { data: meetings } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_phone', user.phone)
    .eq('meeting_date', date);

  // Validate slot is available
  const available = isSlotAvailable(
    date,
    start_time,
    rules || [],
    meetings || [],
    user.timezone
  );

  if (!available) {
    return NextResponse.json({ error: 'This time slot is no longer available' }, { status: 409 });
  }

  // Calculate end time (1 hour later)
  const [h, m] = start_time.split(':').map(Number);
  const endH = h + 1;
  const end_time = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  // Generate tokens
  const confirm_token = generateToken();
  const quote_token = generateToken();
  const accept_token = generateToken();
  const manage_token = generateToken();
  const ends_at = computeEndsAt(date, end_time, user.timezone);

  // Insert meeting
  const { error: insertError } = await supabase
    .from('meetings')
    .insert({
      user_phone: user.phone,
      meeting_date: date,
      start_time,
      end_time,
      visitor_name,
      visitor_email,
      visitor_phone: visitor_phone ?? null,
      note: visitor_address ?? null,
      status: 'pending',
      confirm_token,
      quote_token,
      accept_token,
      manage_token,
      ends_at,
    });

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create meeting request' }, { status: 500 });
  }

  // Notify owner and confirm to visitor
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';
  const smsBody = [
    'New booking request',
    `${formatShortDay(date)} ${formatTime(start_time)}`,
    visitor_phone ? `${visitor_name} – ${formatPhone(visitor_phone)}` : visitor_name,
    visitor_address ? `Note: ${visitor_address}` : null,
    `Email: ${visitor_email}`,
    `Confirm: ${baseUrl}/c/${confirm_token}`,
  ].filter(Boolean).join('\n');

  try {
    const ownerEmail: string | null = (user as { email?: string | null }).email ?? null;
    if (!ownerEmail) {
      console.warn('[email] owner email not set for user', user.phone);
    } else {
      await sendEmail({ to: ownerEmail, subject: `New booking request from ${visitor_name}`, text: smsBody, html: smsBodyToHtml(smsBody) });
    }
    await sendEmail({ to: visitor_email, subject: 'Booking request received', text: `Your request for ${formatShortDay(date)} at ${formatTime(start_time)} has been received. You'll hear back soon.`, html: smsBodyToHtml(`Your request for ${formatShortDay(date)} at ${formatTime(start_time)} has been received. You'll hear back soon.`) });
  } catch (err) {
    console.error('Failed to send request email:', err);
    // Still return success - meeting is created
  }

  return NextResponse.json({ success: true });
}
