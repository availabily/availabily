import { Metadata } from 'next';
import { AvailabilityPageClient } from './client';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;

  // Try to fetch profile for richer metadata
  let title = `@${handle} — AM or PM?`;
  let description = `Book time with @${handle} on AM or PM?`;

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/profile/${handle}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (data.profile) {
        const name = data.profile.display_name || data.profile.business_name;
        if (name) {
          title = `${name} — AM or PM?`;
          description = data.profile.headline || `Book time with ${name}`;
        }
      }
    }
  } catch {
    // Fallback to default metadata
  }

  return { title, description };
}

export default async function HandlePage({ params }: PageProps) {
  const { handle } = await params;
  return <AvailabilityPageClient handle={handle} />;
}
