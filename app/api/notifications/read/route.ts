import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { demoStore } from '@/lib/demo-store';
import { createServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const session = await getSessionFromCookies(cookieStore);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { id?: string; all?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (isDemo) {
    if (body.all) {
      demoStore.markAllNotificationsRead(session.userPhone);
    } else if (body.id) {
      demoStore.markNotificationRead(body.id);
    } else {
      return NextResponse.json({ error: 'Provide id or all:true' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  const supabase = createServerClient();

  if (body.all) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_phone', session.userPhone);
    if (error) return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  } else if (body.id) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', body.id)
      .eq('user_phone', session.userPhone);
    if (error) return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  } else {
    return NextResponse.json({ error: 'Provide id or all:true' }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
