import { notFound } from 'next/navigation';
import { getMeetingByQuoteToken, getOwnerForMeeting } from '@/lib/meeting-lookup';
import { getAccountStatus } from '@/lib/stripe-connect';
import { isSubscribed } from '@/lib/subscription';
import { QuotePageClient } from './client';

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ subscribed?: string }>;
}) {
  const { token } = await params;
  const { subscribed } = await searchParams;
  const meeting = await getMeetingByQuoteToken(token);
  if (!meeting) notFound();

  const [{ user, profile }, stripeStatus] = await Promise.all([
    getOwnerForMeeting(meeting),
    getAccountStatus(meeting.user_phone),
  ]);

  return (
    <QuotePageClient
      meeting={meeting}
      ownerProfile={profile}
      stripeStatus={stripeStatus}
      paymentsEnabled={user?.payments_enabled ?? true}
      subscribed={isSubscribed(user)}
      // After returning from subscription checkout, jump straight back into the
      // quoted-service flow instead of the type chooser.
      startQuoted={subscribed === '1'}
    />
  );
}
