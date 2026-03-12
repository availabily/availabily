import { NextResponse } from 'next/server';
import { getSessionCookieOptions } from '@/lib/session';

export async function POST() {
  const cookieOpts = getSessionCookieOptions();
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: cookieOpts.name,
    value: '',
    httpOnly: cookieOpts.httpOnly,
    secure: cookieOpts.secure,
    sameSite: cookieOpts.sameSite,
    maxAge: 0,
    path: cookieOpts.path,
  });
  return response;
}
