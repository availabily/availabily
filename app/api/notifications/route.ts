import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { demoStore } from '@/lib/demo-store';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function GET() {
  const cookieStore = await cookies();
  const session = await getSessionFromCookies(cookieStore);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isDemo) {
    const notifications = demoStore.getNotifications(session.userPhone);
    const unreadCount = demoStore.getUnreadCount(session.userPhone);
    return NextResponse.json({ notifications, unreadCount });
  }

  const supabase = createServerClient();
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_phone', session.userPhone)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;
  return NextResponse.json({ notifications: notifications ?? [], unreadCount });
}
