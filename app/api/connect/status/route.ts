import { NextRequest, NextResponse } from 'next/server';
import { getAccountStatus } from '@/lib/stripe-connect';
import { isValidE164 } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone') ?? '';

  if (!isValidE164(phone)) {
    return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
  }

  const status = await getAccountStatus(phone);
  return NextResponse.json(status ?? { exists: false });
}
