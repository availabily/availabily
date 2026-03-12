import { redirect } from 'next/navigation';
import { getSessionPhone } from '@/lib/session';
import { DashboardClient } from './client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — AM or PM?',
};

export default async function DashboardPage() {
  const phone = await getSessionPhone();
  if (!phone) {
    redirect('/login');
  }

  return <DashboardClient />;
}
