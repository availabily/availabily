import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { getSessionUser } from '@/lib/auth';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function GET(request: NextRequest) {
  const sessionUser = getSessionUser(request);
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isDemo) {
    const allMeetings = demoStore.getMeetings(
      sessionUser.userPhone,
      '2000-01-01',
      '2999-12-31'
    );
    const pending = allMeetings
      .filter((m) => m.status === 'pending')
      .sort((a, b) => {
        if (a.meeting_date !== b.meeting_date) return a.meeting_date.localeCompare(b.meeting_date);
        return a.start_time.localeCompare(b.start_time);
      });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const recent = allMeetings
      .filter((m) => m.status !== 'pending' && m.meeting_date >= sevenDaysAgo)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return NextResponse.json({ pending, recent });
  }

  const supabase = createServerClient();

  const { data: pending, error: pendingError } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_phone', sessionUser.userPhone)
    .eq('status', 'pending')
    .order('meeting_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (pendingError) {
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const { data: recent, error: recentError } = await supabase
    .from('meetings')
    .select('*')
    .eq('user_phone', sessionUser.userPhone)
    .neq('status', 'pending')
    .gte('meeting_date', sevenDaysAgo)
    .order('created_at', { ascending: false });

  if (recentError) {
    return NextResponse.json({ error: 'Failed to fetch recent meetings' }, { status: 500 });
  }

  return NextResponse.json({ pending: pending ?? [], recent: recent ?? [] });
}
