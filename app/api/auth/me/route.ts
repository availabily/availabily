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
    const user = demoStore.getUserByPhone(sessionUser.userPhone);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({
      phone: user.phone,
      email: user.email ?? null,
      handle: user.handle,
      timezone: user.timezone,
    });
  }

  const supabase = createServerClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('phone, handle, timezone, email')
    .eq('phone', sessionUser.userPhone)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    phone: user.phone,
    email: user.email ?? null,
    handle: user.handle,
    timezone: user.timezone,
  });
}
