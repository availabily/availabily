import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { getSessionPhone } from '@/lib/session';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// GET /api/notifications — return all notifications for the logged-in user
export async function GET() {
  const phone = await getSessionPhone();
  if (!phone) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (isDemo) {
    const notifications = demoStore.getNotifications(phone);
    return NextResponse.json({ notifications });
  }

  const supabase = createServerClient();
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_phone', phone)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  return NextResponse.json({ notifications: notifications ?? [] });
}

// PATCH /api/notifications — mark notifications as read
export async function PATCH(request: NextRequest) {
  const phone = await getSessionPhone();
  if (!phone) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { ids?: string[]; all?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (isDemo) {
    if (body.all) {
      demoStore.markAllNotificationsRead(phone);
    } else if (body.ids?.length) {
      demoStore.markNotificationsRead(phone, body.ids);
    }
    return NextResponse.json({ success: true });
  }

  const supabase = createServerClient();

  if (body.all) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_phone', phone);
  } else if (body.ids?.length) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_phone', phone)
      .in('id', body.ids);
  }

  return NextResponse.json({ success: true });
}
