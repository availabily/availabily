import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { createSessionToken, getSessionCookieOptions } from '@/lib/session';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();

  if (!email || !code) {
    return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
  }

  // ── Demo mode ──
  if (isDemo) {
    const user = demoStore.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
    }
    const valid = demoStore.verifyMagicCode(email, code);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
    }
    const token = createSessionToken(user.phone);
    const cookieOpts = getSessionCookieOptions();
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: cookieOpts.name,
      value: token,
      httpOnly: cookieOpts.httpOnly,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      maxAge: cookieOpts.maxAge,
      path: cookieOpts.path,
    });
    return response;
  }

  // ── Production ──
  const supabase = createServerClient();

  // Look up a valid, unused code for this email
  const now = new Date().toISOString();
  const { data: codeRow } = await supabase
    .from('magic_codes')
    .select('id, email')
    .eq('email', email)
    .eq('code', code)
    .eq('used', false)
    .gte('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!codeRow) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
  }

  // Mark code as used
  await supabase
    .from('magic_codes')
    .update({ used: true })
    .eq('id', codeRow.id);

  // Look up user phone by email
  const { data: user } = await supabase
    .from('users')
    .select('phone')
    .eq('email', email)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const token = createSessionToken(user.phone);
  const cookieOpts = getSessionCookieOptions();
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: cookieOpts.name,
    value: token,
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    maxAge: cookieOpts.maxAge,
    path: cookieOpts.path,
  });
  return response;
}
