import { Metadata } from 'next';
import { AvailabilityPageClient } from './[handle]/client';

const HOMEPAGE_HANDLE = 'consultant';

export async function generateMetadata(): Promise<Metadata> {
  let title = 'AM or PM? — Schedule jobs. Get booked by text.';
  let description = 'Book time with a consultant on AM or PM?';

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/profile/${HOMEPAGE_HANDLE}`, { next: { revalidate: 60 } });
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

export default function HomePage() {
  return <AvailabilityPageClient handle={HOMEPAGE_HANDLE} />;
}
