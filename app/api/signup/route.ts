import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendSMS } from '@/lib/twilio';
import { isValidE164, toE164 } from '@/lib/utils';

interface DaySchedule {
  enabled: boolean;
  start_time: string;
  end_time: string;
}

interface SignupBody {
  phone: string;
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

  const { phone: rawPhone, handle, timezone, schedule } = body;

  // Validate required fields
  if (!rawPhone || !handle || !timezone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

  // Create user
  const { error: userError } = await supabase
    .from('users')
    .insert({ phone, handle, timezone });

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

  // Send welcome SMS
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://availabily.com';
  try {
    await sendSMS(phone, `Your Availabily page is live. ${baseUrl}/${handle}`);
  } catch (err) {
    console.error('Failed to send welcome SMS:', err);
    // Don't fail the signup if SMS fails
  }

  return NextResponse.json({ success: true, handle });
}
