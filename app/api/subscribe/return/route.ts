import { NextRequest, NextResponse } from 'next/server';
import { syncSubscription } from '@/lib/subscription';

// Stripe returns the owner here after subscription checkout. We re-read the
// subscription status from Stripe (so we don't depend solely on the webhook),
// then bounce back to the quote page they came from.
export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone') ?? '';
  const token = request.nextUrl.searchParams.get('token') ?? '';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

  if (phone) {
    try {
      await syncSubscription(phone);
    } catch (err) {
      console.error('Failed to sync subscription on return:', err);
    }
  }

  const dest = token ? `${baseUrl}/q/${encodeURIComponent(token)}?subscribed=1` : `${baseUrl}/`;
  return NextResponse.redirect(dest, 302);
}
