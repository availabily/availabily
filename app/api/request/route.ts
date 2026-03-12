import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { sendEmail } from '@/lib/email';
import { isSlotAvailable } from '@/lib/scheduling';
import { isValidE164, toE164, formatPhone, formatTime, formatShortDay, formatFullDay } from '@/lib/utils';
import { nanoid } from 'nanoid';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface RequestBody {
  handle: string;
  date: string;
  start_time: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_address: string;
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { handle, date, start_time, visitor_name, visitor_phone: rawVisitorPhone, visitor_address } = body;

  if (!handle || !date || !start_time || !visitor_name || !rawVisitorPhone || !visitor_address) {
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

  // Validate address length
  if (visitor_address.length > 200) {
    return NextResponse.json({ error: 'Address is too long (max 200 characters)' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';

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
      note: visitor_address,
      status: 'pending',
      confirm_token,
      created_at: now,
    });

    const confirmUrl = `${baseUrl}/c/${confirm_token}`;
    const notifTitle = `New request: ${formatShortDay(date)} at ${formatTime(start_time)}`;
    const notifBody = `${visitor_name} – ${formatPhone(visitor_phone)}\n${visitor_address}`;

    demoStore.createNotification({
      user_phone: user.phone,
      title: notifTitle,
      body: notifBody,
      link: confirmUrl,
      is_read: false,
    });

    if (user.email) {
      await sendEmail(
        user.email,
        `New time request — ${formatFullDay(date)} at ${formatTime(start_time)}`,
        buildNotificationEmail(visitor_name, visitor_phone, visitor_address, date, start_time, confirmUrl, baseUrl),
      );
    }

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
      note: visitor_address,
      status: 'pending',
      confirm_token,
    });

  if (insertError) {
    return NextResponse.json({ error: 'Failed to create meeting request' }, { status: 500 });
  }

  const confirmUrl = `${baseUrl}/c/${confirm_token}`;
  const notifTitle = `New request: ${formatShortDay(date)} at ${formatTime(start_time)}`;
  const notifBody = `${visitor_name} – ${formatPhone(visitor_phone)}\n${visitor_address}`;

  // Create in-app notification
  const { error: notifError } = await supabase
    .from('notifications')
    .insert({
      user_phone: user.phone,
      title: notifTitle,
      body: notifBody,
      link: confirmUrl,
      is_read: false,
    });

  if (notifError) {
    console.error('Failed to create notification:', notifError);
  }

  // Send email notification to owner
  if (user.email) {
    try {
      await sendEmail(
        user.email,
        `New time request — ${formatFullDay(date)} at ${formatTime(start_time)}`,
        buildNotificationEmail(visitor_name, visitor_phone, visitor_address, date, start_time, confirmUrl, baseUrl),
      );
    } catch (err) {
      console.error('Failed to send notification email:', err);
      // Still return success - meeting is created
    }
  }

  return NextResponse.json({ success: true });
}

function buildNotificationEmail(
  visitorName: string,
  visitorPhone: string,
  visitorAddress: string,
  date: string,
  startTime: string,
  confirmUrl: string,
  baseUrl: string,
): string {
  const dayName = formatFullDay(date);
  const time = formatTime(startTime);
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;color:#1e293b;">
      <h2 style="color:#4f46e5;margin-bottom:8px;">📅 New time request</h2>
      <div style="background:#eef2ff;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:20px;font-weight:bold;color:#312e81;">${dayName} at ${time}</p>
      </div>
      <p style="margin:8px 0;"><strong>${visitorName}</strong> – ${formatPhone(visitorPhone)}</p>
      <p style="margin:8px 0;">📍 ${visitorAddress}</p>
      <a href="${confirmUrl}" style="display:inline-block;background:#16a34a;color:#fff;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;margin-top:16px;font-size:16px;">✓ Confirm this request →</a>
      <p style="margin-top:20px;font-size:13px;color:#64748b;">Or <a href="${baseUrl}/dashboard" style="color:#4f46e5;">view your dashboard</a> to manage all requests.</p>
    </div>
  `;
}
