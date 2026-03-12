import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { sendEmail } from '@/lib/email';
import { isValidE164, toE164 } from '@/lib/utils';
import { sendSMS } from '@/lib/infobip';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface DaySchedule {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

interface SignupBody {
  phone: string;
  email: string;
  handle: string;
  timezone: string;
  schedule: Record<string, DaySchedule>;
}

export async function POST(request: NextRequest) {
  let body: SignupBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { phone: rawPhone, email: rawEmail, handle, timezone, schedule } = body;

  // Validate required fields
  if (!rawPhone || !handle || !timezone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate email
  const email = rawEmail ? rawEmail.toLowerCase().trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
  }

  // Validate and normalize phone
  const phone = rawPhone.startsWith('+') ? rawPhone : toE164(rawPhone);
  if (!isValidE164(phone)) {
    return NextResponse.json({ error: 'Invalid phone number format. Use E.164 (e.g. +18085553434)' }, { status: 400 });
  }

  // Validate handle
  if (!/^[a-z0-9-]+$/.test(handle) || handle.length < 2 || handle.length > 30) {
    return NextResponse.json({ error: 'Handle must be 2-30 lowercase alphanumeric characters or hyphens' }, { status: 400 });
  }

  // ── Demo mode: use in-memory store ──
  if (isDemo) {
    if (demoStore.getUserByHandle(handle)) {
      return NextResponse.json({ error: 'Handle is already taken' }, { status: 409 });
    }
    if (demoStore.getUserByPhone(phone)) {
      return NextResponse.json({ error: 'Phone number is already registered' }, { status: 409 });
    }
    if (demoStore.getUserByEmail(email)) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }
    demoStore.createUser({ phone, handle, timezone, email, created_at: new Date().toISOString() });
    if (schedule) {
      const rules = Object.entries(schedule)
        .filter(([, day]) => day.enabled && day.start_time && day.end_time)
        .map(([dayIndex, day]) => ({
          user_phone: phone,
          rule_type: 'available' as const,
          day_of_week: parseInt(dayIndex, 10),
          start_time: day.start_time,
          end_time: day.end_time,
          is_recurring: true,
          date: null,
        }));
      if (rules.length > 0) demoStore.createTimeRules(rules);
    }
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';
    const welcomeHtml = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h1 style="font-size:24px;font-weight:700;color:#1e293b;">Welcome to <span style="color:#4f46e5;">AM or PM?</span> 🎉</h1>
        <p style="color:#64748b;margin:16px 0;">Your page is live at:</p>
        <a href="${baseUrl}/${handle}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;padding:12px 24px;border-radius:12px;text-decoration:none;margin-bottom:24px;">${baseUrl}/${handle}</a>
        <p style="color:#94a3b8;font-size:13px;">Share this link with customers so they can book a time with you.</p>
      </div>
    `;
    await sendEmail(email, 'Your AM or PM? page is live!', welcomeHtml);
    try {
      await sendSMS(phone, `Your AM or PM? page is live. ${baseUrl}/${handle}`);
    } catch (err) {
      console.error('Welcome SMS failed (non-fatal):', err);
    }
    return NextResponse.json({ success: true, handle });
  }

  // ── Production: use Supabase ──
  const supabase = createServerClient();

  // Check handle uniqueness
  const { data: existingHandle } = await supabase
    .from('users')
    .select('handle')
    .eq('handle', handle)
    .single();

  if (existingHandle) {
    return NextResponse.json({ error: 'Handle is already taken' }, { status: 409 });
  }

  // Check phone uniqueness
  const { data: existingPhone } = await supabase
    .from('users')
    .select('phone')
    .eq('phone', phone)
    .single();

  if (existingPhone) {
    return NextResponse.json({ error: 'Phone number is already registered' }, { status: 409 });
  }

  // Check email uniqueness
  const { data: existingEmail } = await supabase
    .from('users')
    .select('phone')
    .eq('email', email)
    .single();

  if (existingEmail) {
    return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
  }

  // Create user
  const { error: userError } = await supabase
    .from('users')
    .insert({ phone, handle, timezone, email });

  if (userError) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }

  // Create time rules for each enabled day
  if (schedule) {
    const timeRules = Object.entries(schedule)
      .filter(([, day]) => day.enabled && day.start_time && day.end_time)
      .map(([dayIndex, day]) => ({
        user_phone: phone,
        rule_type: 'available',
        day_of_week: parseInt(dayIndex, 10),
        start_time: day.start_time,
        end_time: day.end_time,
        is_recurring: true,
        date: null,
      }));

    if (timeRules.length > 0) {
      const { error: rulesError } = await supabase
        .from('time_rules')
        .insert(timeRules);

      if (rulesError) {
        console.error('Failed to create time rules:', rulesError);
      }
    }
  }

  // Send welcome email
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';
  const welcomeHtml = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
      <h1 style="font-size:24px;font-weight:700;color:#1e293b;">Welcome to <span style="color:#4f46e5;">AM or PM?</span> 🎉</h1>
      <p style="color:#64748b;margin:16px 0;">Your page is live at:</p>
      <a href="${baseUrl}/${handle}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;padding:12px 24px;border-radius:12px;text-decoration:none;margin-bottom:24px;">${baseUrl}/${handle}</a>
      <p style="color:#94a3b8;font-size:13px;">Share this link with customers so they can book a time with you.</p>
    </div>
  `;
  try {
    await sendEmail(email, 'Your AM or PM? page is live!', welcomeHtml);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }

  // Also try SMS as a silent fallback
  try {
    await sendSMS(phone, `Your AM or PM? page is live. ${baseUrl}/${handle}`);
  } catch (err) {
    console.error('Failed to send welcome SMS (non-fatal):', err);
  }

  return NextResponse.json({ success: true, handle });
}
