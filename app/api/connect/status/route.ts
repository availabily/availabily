import { NextRequest, NextResponse } from 'next/server';
import { getAccountStatus } from '@/lib/stripe-connect';

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone') ?? '';

  if (!phone) {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 });
  }

  const status = await getAccountStatus(phone);
  return NextResponse.json(status ?? { exists: false });
}
