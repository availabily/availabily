import { NextRequest, NextResponse } from 'next/server';
import { demoStore } from '@/lib/demo-store';
import { createServerClient } from '@/lib/supabase';
import { isDemo } from '@/lib/stripe';
import { ensureAccountRecord, createOnboardingLink } from '@/lib/stripe-connect';
import { isValidE164 } from '@/lib/utils';

// V1 auth: phone param is sufficient because Stripe onboarding itself is the
// auth wall and account IDs aren't guessable. Before scaling, gate this with
// a phone-verified session.

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone') ?? '';

  if (!isValidE164(phone)) {
    return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });
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

  const account = await ensureAccountRecord(phone);
  const url = await createOnboardingLink(account.stripe_account_id, phone);
  return NextResponse.redirect(url, 302);
}
