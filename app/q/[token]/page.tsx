import { notFound } from 'next/navigation';
import { getMeetingByQuoteToken, getOwnerForMeeting } from '@/lib/meeting-lookup';
import { getAccountStatus } from '@/lib/stripe-connect';
import { QuotePageClient } from './client';

export default async function QuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const meeting = await getMeetingByQuoteToken(token);
  if (!meeting) notFound();

  const [{ profile }, stripeStatus] = await Promise.all([
    getOwnerForMeeting(meeting),
    getAccountStatus(meeting.user_phone),
  ]);

  return (
    <QuotePageClient
      meeting={meeting}
      ownerProfile={profile}
      stripeStatus={stripeStatus}
    />
  );
}
