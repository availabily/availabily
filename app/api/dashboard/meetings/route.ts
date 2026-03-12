import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { demoStore } from '@/lib/demo-store';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET() {
  const cookieStore = await cookies();
  const session = await getSessionFromCookies(cookieStore);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  if (isDemo) {
    const pending = demoStore.getPendingMeetings(session.userPhone);
    const recent = demoStore.getRecentMeetings(session.userPhone, sevenDaysAgo);
    return NextResponse.json({ pending, recent });
  }

  const supabase = createServerClient();

  const [{ data: pending }, { data: recent }] = await Promise.all([
    supabase
      .from('meetings')
      .select('*')
      .eq('user_phone', session.userPhone)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
    supabase
      .from('meetings')
      .select('*')
      .eq('user_phone', session.userPhone)
      .neq('status', 'pending')
      .gte('meeting_date', sevenDaysAgo)
      .order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({ pending: pending ?? [], recent: recent ?? [] });
}
