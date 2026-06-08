import { notFound } from 'next/navigation';
import { getUserByManageToken } from '@/lib/user-lookup';
import { AccountPageClient } from './client';

export const dynamic = 'force-dynamic';

export default async function AccountPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getUserByManageToken(token);
  if (!user) notFound();

  return (
    <AccountPageClient token={token} handle={user.handle} />
  );
}
