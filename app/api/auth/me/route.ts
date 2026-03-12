import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = await getSessionFromCookies(cookieStore);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    email: session.email,
    userPhone: session.userPhone,
    handle: session.handle,
  });
}
