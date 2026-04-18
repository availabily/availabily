import { notFound } from 'next/navigation';
import { getMeetingByManageToken } from '@/lib/meeting-lookup';
import { ManagePageClient } from './client';

export default async function ManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const meeting = await getMeetingByManageToken(token);
  if (!meeting) notFound();

  return <ManagePageClient meeting={meeting} />;
}
