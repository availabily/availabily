import { Metadata } from 'next';
import { AvailabilityPageClient } from './client';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: `@${handle} — AM or PM?`,
    description: `Book time with @${handle} on AM or PM?`,
  };
}

export default async function HandlePage({ params }: PageProps) {
  const { handle } = await params;
  return <AvailabilityPageClient handle={handle} />;
}
