import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { verifyOTP, createSession } from '@/lib/auth';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, code } = body;
  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  if (!verifyOTP(normalizedEmail, code.trim())) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
  }

  // Look up user by email
  let user: { phone: string; handle: string; email: string } | null = null;

  if (isDemo) {
    const demoUser = demoStore.getUserByEmail(normalizedEmail);
    if (demoUser && demoUser.email) {
      user = { phone: demoUser.phone, handle: demoUser.handle, email: demoUser.email };
    }
  } else {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('users')
      .select('phone, handle, email')
      .eq('email', normalizedEmail)
      .single();
    if (data) {
      user = data as { phone: string; handle: string; email: string };
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const token = createSession(user.phone, user.email, user.handle);

  const response = NextResponse.json({ success: true, handle: user.handle });
  response.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
