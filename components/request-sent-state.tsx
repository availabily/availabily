'use client';

import Link from 'next/link';
import { formatDateDisplay, formatTime } from '@/lib/utils';
import { cn } from '@/lib/cn';

interface RequestSentStateProps {
  displayName?: string;
  date?: string;
  startTime?: string;
  className?: string;
}

export function RequestSentState({
  displayName,
  date,
  startTime,
  className,
}: RequestSentStateProps) {
  const who = displayName || 'The business owner';
  const hasTime = !!date && !!startTime;

  return (
    <div
      className={cn(
        'bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-8 text-center',
        'animate-in fade-in zoom-in-95 duration-300',
        className
      )}
    >
      <div className="relative w-20 h-20 mx-auto mb-5">
        <div
          aria-hidden
          className="absolute inset-0 rounded-full bg-emerald-100/60 animate-ping"
        />
        <div className="absolute inset-0 rounded-full bg-emerald-50 flex items-center justify-center shadow-[0_0_0_4px_rgba(16,185,129,0.08)]">
          <svg
            className="w-10 h-10 text-emerald-500 animate-in zoom-in-50 duration-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.4}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      </div>

      <h2 className="font-display text-[26px] font-bold text-slate-900 mb-2">
        Request sent!
      </h2>
      <p className="text-slate-600 leading-relaxed max-w-[32ch] mx-auto">
        {who} will confirm your request by email. You&apos;ll hear back shortly.
      </p>

      {hasTime && (
        <div className="mt-5 mx-auto inline-block rounded-2xl bg-brand-50 border border-brand-100 px-4 py-2.5">
          <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">
            You requested
          </p>
          <p className="text-sm font-bold text-brand-900 mt-0.5">
            {formatDateDisplay(date!)} · {formatTime(startTime!)}
          </p>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-slate-100">
        <p className="text-sm text-slate-400 mb-3">Want your own booking profile?</p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          Set up yours →
        </Link>
      </div>
    </div>
  );
}
