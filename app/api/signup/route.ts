import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { sendEmail } from '@/lib/email';
import { isValidE164, toE164 } from '@/lib/utils';

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

  const { phone: rawPhone, email, handle, timezone, schedule } = body;

  // Validate required fields
  if (!rawPhone || !email || !handle || !timezone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://amorpm.com';

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
    await sendEmail(
      email,
      'Your AM or PM? page is live!',
      buildWelcomeEmail(handle, baseUrl),
    );
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
    .select('email')
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
  try {
    await sendEmail(
      email,
      'Your AM or PM? page is live!',
      buildWelcomeEmail(handle, baseUrl),
    );
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    // Don't fail the signup if email fails
  }

  return NextResponse.json({ success: true, handle });
}

function buildWelcomeEmail(handle: string, baseUrl: string): string {
  const pageUrl = `${baseUrl}/${handle}`;
  const loginUrl = `${baseUrl}/login`;
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px;color:#1e293b;">
      <h2 style="color:#4f46e5;margin-bottom:8px;">🎉 Your page is live!</h2>
      <p>Your AM or PM? availability page is ready. Share the link below with your customers so they can book a time with you.</p>
      <div style="background:#eef2ff;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#6366f1;font-weight:600;">Your shareable link</p>
        <a href="${pageUrl}" style="font-size:18px;font-weight:bold;color:#4f46e5;text-decoration:none;">${pageUrl}</a>
      </div>
      <p>When customers book a time, you'll receive an email with their details and a confirm link.</p>
      <p>Log in to your dashboard to view all booking requests:</p>
      <a href="${loginUrl}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:8px;">View dashboard →</a>
    </div>
  `;
}
