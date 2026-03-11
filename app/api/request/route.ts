import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { sendSMS } from '@/lib/twilio';
import { isSlotAvailable } from '@/lib/scheduling';
import { isValidE164, toE164, formatPhone, formatTime, formatShortDay } from '@/lib/utils';
import { nanoid } from 'nanoid';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface RequestBody {
  handle: string;
  date: string;
  start_time: string;
  visitor_name: string;
  visitor_phone: string;
  note?: string;
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { handle, date, start_time, visitor_name, visitor_phone: rawVisitorPhone, note } = body;

  if (!handle || !date || !start_time || !visitor_name || !rawVisitorPhone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
  }

  // Validate time format
  if (!/^\d{2}:\d{2}$/.test(start_time)) {
    return NextResponse.json({ error: 'Invalid time format. Use HH:MM' }, { status: 400 });
  }

  // Normalize and validate visitor phone
  const visitor_phone = rawVisitorPhone.startsWith('+') ? rawVisitorPhone : toE164(rawVisitorPhone);
  if (!isValidE164(visitor_phone)) {
    return NextResponse.json({ error: 'Invalid visitor phone number' }, { status: 400 });
  }

  // ── Demo mode: use in-memory store ──
  if (isDemo) {
    const user = demoStore.getUserByHandle(handle);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (demoStore.countPendingMeetings(user.phone, visitor_phone, twentyFourHoursAgo) >= 3) {
      return NextResponse.json({ error: 'Too many pending requests.' }, { status: 429 });
    }

    const rules = demoStore.getTimeRules(user.phone);
    const meetings = demoStore.getMeetingsByDate(user.phone, date);
    if (!isSlotAvailable(date, start_time, rules, meetings, user.timezone)) {
      return NextResponse.json({ error: 'This time slot is no longer available' }, { status: 409 });
    }

    const [h, m] = start_time.split(':').map(Number);
    const end_time = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const confirm_token = nanoid(12);
    const now = new Date().toISOString();

    demoStore.createMeeting({
      id: `meeting-${Math.random().toString(36).slice(2)}`,
      user_phone: user.phone,
      meeting_date: date,
      start_time,
      end_time,
      visitor_name,
      visitor_phone,
      note: note || null,
      status: 'pending',
      confirm_token,
      created_at: now,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://availabily.com';
    const smsBody = [
      'New time request',
      `${formatShortDay(date)} ${formatTime(start_time)}`,
      `${visitor_name} – ${formatPhone(visitor_phone)}`,
      note || null,
      `Confirm: ${baseUrl}/c/${confirm_token}`,
    ].filter(Boolean).join('\n');
    await sendSMS(user.phone, smsBody);
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

  // Generate confirm token
  const confirm_token = nanoid(12);

  // Insert meeting
  const { error: insertError } = await supabase
    .from('meetings')
    .insert({
      user_phone: user.phone,
      meeting_date: date,
      start_time,
      end_time,
      visitor_name,
      visitor_phone,
      note: note || null,
      status: 'pending',
      confirm_token,
    });

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create meeting request' }, { status: 500 });
  }

  // Send SMS to owner
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://availabily.com';
  const smsBody = [
    'New time request',
    `${formatShortDay(date)} ${formatTime(start_time)}`,
    `${visitor_name} – ${formatPhone(visitor_phone)}`,
    note ? note : null,
    `Confirm: ${baseUrl}/c/${confirm_token}`,
  ].filter(Boolean).join('\n');

  try {
    await sendSMS(user.phone, smsBody);
  } catch (err) {
    console.error('Failed to send request SMS:', err);
    // Still return success - meeting is created
  }

  return NextResponse.json({ success: true });
}
