import { notFound } from 'next/navigation';
import { getMeetingByAcceptToken, getOwnerForMeeting } from '@/lib/meeting-lookup';
import { AcceptPageClient } from './client';

export default async function AcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const meeting = await getMeetingByAcceptToken(token);
  if (!meeting) notFound();

  const { user, profile } = await getOwnerForMeeting(meeting);

  return <AcceptPageClient meeting={meeting} user={user} profile={profile} />;
}
