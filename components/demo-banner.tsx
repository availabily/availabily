'use client';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center">
      <p className="text-sm text-amber-800">
        <span className="font-semibold">Demo mode</span>
        {' · '}Data is in-memory (resets on server restart) · SMS is logged to console · Visit{' '}
        <a href="/demo" className="font-semibold underline hover:text-amber-900">
          /demo
        </a>{' '}
        to see a pre-built availability page
      </p>
    </div>
  );
}
