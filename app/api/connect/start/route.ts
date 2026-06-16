import { NextRequest, NextResponse } from 'next/server';
import { demoStore } from '@/lib/demo-store';
import { createServerClient } from '@/lib/supabase';
import { isDemo } from '@/lib/stripe';
import { ensureAccountRecord, createOnboardingLink } from '@/lib/stripe-connect';

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone') ?? '';

  if (!phone) {
    return NextResponse.json({ error: 'phone is required' }, { status: 400 });
  }

  if (isDemo) {
    const user = demoStore.getUserByPhone(phone);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // In demo mode, mark as fully onboarded immediately
    const account = await ensureAccountRecord(phone);
    const url = await createOnboardingLink(account.stripe_account_id, phone);
    return NextResponse.redirect(url, 302);
  }

  const supabase = createServerClient();
  const { data: user } = await supabase
    .from('users')
    .select('phone')
    .eq('phone', phone)
    .maybeSingle();
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Stripe account creation / onboarding-link generation can fail for reasons
  // outside this request (e.g. Connect not enabled on the platform account).
  // Catch it and send the owner to a friendly setup page instead of a raw 500.
  try {
    const account = await ensureAccountRecord(phone);
    const url = await createOnboardingLink(account.stripe_account_id, phone);
    return NextResponse.redirect(url, 302);
  } catch (err) {
    console.error('[connect/start] failed to start Stripe onboarding for', phone, err);
    const dest = new URL('/connect/return', request.url);
    dest.searchParams.set('phone', phone);
    dest.searchParams.set('error', 'connect');
    return NextResponse.redirect(dest, 302);
  }
}
