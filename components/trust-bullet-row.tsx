'use client';

import { cn } from '@/lib/cn';

interface TrustBulletRowProps {
  bullets: string[];
  className?: string;
}

const MAX_BULLET_DISPLAY_LENGTH = 50;

export function TrustBulletRow({ bullets, className }: TrustBulletRowProps) {
  if (bullets.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      {bullets.slice(0, 3).map((bullet, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
        >
          <svg className="w-3 h-3 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {bullet.length > MAX_BULLET_DISPLAY_LENGTH ? bullet.slice(0, MAX_BULLET_DISPLAY_LENGTH - 3) + '…' : bullet}
        </span>
      ))}
    </div>
  );
}
