import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function PATCH(request: NextRequest) {
  let body: { phone?: string; handle?: string; payments_enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.payments_enabled !== 'boolean') {
    return NextResponse.json({ error: 'payments_enabled must be a boolean' }, { status: 400 });
  }
  if (!body.phone && !body.handle) {
    return NextResponse.json({ error: 'Either phone or handle is required' }, { status: 400 });
  }

  if (isDemo) {
    let phone = body.phone ?? '';
    if (!phone && body.handle) {
      const u = demoStore.getUserByHandle(body.handle);
      if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      phone = u.phone;
    }
    demoStore.updateUser(phone, { payments_enabled: body.payments_enabled });
    return NextResponse.json({ success: true });
  }

  const supabase = createServerClient();

  let phone = body.phone ?? '';
  if (!phone && body.handle) {
    const { data: u } = await supabase.from('users').select('phone').eq('handle', body.handle).single();
    if (!u) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    phone = u.phone;
  }

  const { error } = await supabase
    .from('users')
    .update({ payments_enabled: body.payments_enabled })
    .eq('phone', phone);

  if (error) {
    console.error('Failed to update user settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
