import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone') ?? '';
  const dest = new URL('/api/connect/start', request.url);
  dest.searchParams.set('phone', phone);
  return NextResponse.redirect(dest, 302);
}
