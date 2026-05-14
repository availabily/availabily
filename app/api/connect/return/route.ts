import { NextRequest, NextResponse } from 'next/server';
import { refreshAccountStatus } from '@/lib/stripe-connect';

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone') ?? '';

  if (!phone) {
    return NextResponse.redirect(new URL('/', request.url), 302);
  }

  await refreshAccountStatus(phone);

  const dest = new URL('/connect/return', request.url);
  dest.searchParams.set('phone', phone);
  return NextResponse.redirect(dest, 302);
}
