'use client';

import Link from 'next/link';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center">
      <p className="text-sm text-amber-800">
        <span className="font-semibold">Demo mode</span>
        {' · '}Data is in-memory (resets on server restart) · Email is logged to console · Visit{' '}
        <Link href="/demo" className="font-semibold underline hover:text-amber-900">
          /demo
        </Link>{' '}
        to see a pre-built availability page
      </p>
    </div>
  );
}
