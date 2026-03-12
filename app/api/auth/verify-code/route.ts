import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP, createSession, getUserByEmail } from '@/lib/auth';

const SEVEN_DAYS = 7 * 24 * 60 * 60;
const isProduction = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email: rawEmail, code } = body;
  if (!rawEmail || !code) {
    return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
  }

  const email = rawEmail.trim().toLowerCase();

  const valid = verifyOTP(email, String(code).trim());
  if (!valid) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
  }

  const user = await getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const token = createSession(email, user.phone, user.handle);

  const response = NextResponse.json({ success: true, handle: user.handle });
  response.cookies.set('session_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SEVEN_DAYS,
    secure: isProduction,
  });

  return response;
}
