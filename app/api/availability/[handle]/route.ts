import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { computeAvailability } from '@/lib/scheduling';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params;
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

  // Fetch time rules
  const { data: rules, error: rulesError } = await supabase
    .from('time_rules')
    .select('*')
    .eq('user_phone', user.phone);

  if (rulesError) {
    return NextResponse.json({ error: 'Failed to fetch time rules' }, { status: 500 });
  }

  // Fetch meetings (last 30 days + next 14 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fourteenDaysFromNow = new Date();
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_phone', user.phone)
    .gte('meeting_date', thirtyDaysAgo.toISOString().split('T')[0])
    .lte('meeting_date', fourteenDaysFromNow.toISOString().split('T')[0]);

  if (meetingsError) {
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }

  const days = computeAvailability(rules || [], meetings || [], user.timezone);

  return NextResponse.json({
    handle: user.handle,
    timezone: user.timezone,
    days,
  });
}
