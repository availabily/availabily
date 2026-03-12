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
    const notifications = demoStore.getNotifications(sessionUser.userPhone);
    const unread_count = demoStore.getUnreadCount(sessionUser.userPhone);
    return NextResponse.json({ notifications, unread_count });
  }

  const supabase = createServerClient();
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_phone', sessionUser.userPhone)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  const unread_count = (notifications ?? []).filter((n) => !n.is_read).length;

  return NextResponse.json({ notifications: notifications ?? [], unread_count });
}
