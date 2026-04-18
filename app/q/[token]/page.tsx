import { notFound } from 'next/navigation';
import { getMeetingByQuoteToken } from '@/lib/meeting-lookup';
import { QuotePageClient } from './client';

export default async function QuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const meeting = await getMeetingByQuoteToken(token);
  if (!meeting) notFound();

  return <QuotePageClient meeting={meeting} />;
}
