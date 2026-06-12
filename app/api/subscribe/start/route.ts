import { NextRequest, NextResponse } from 'next/server';
import { demoStore } from '@/lib/demo-store';
import { createServerClient } from '@/lib/supabase';
import { isDemo } from '@/lib/stripe';
import { createSubscriptionCheckoutUrl } from '@/lib/subscription';

// Starts the $4.99/mo owner subscription checkout and redirects to Stripe
// (or, in demo mode, activates immediately and bounces back to /q/[token]).
export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone') ?? '';
  const token = request.nextUrl.searchParams.get('token') ?? '';

  if (!phone || !token) {
    return NextResponse.json({ error: 'phone and token are required' }, { status: 400 });
  }

  // Confirm the owner exists.
  if (isDemo) {
    if (!demoStore.getUserByPhone(phone)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } else {
    const supabase = createServerClient();
    const { data: user } = await supabase
      .from('users')
      .select('phone')
      .eq('phone', phone)
      .maybeSingle();
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const url = await createSubscriptionCheckoutUrl(phone, token);
    return NextResponse.redirect(url, 302);
  } catch (err) {
    console.error('Failed to start subscription checkout:', err);
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}
