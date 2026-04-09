'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

interface RequestSentStateProps {
  displayName?: string;
  className?: string;
}

export function RequestSentState({ displayName, className }: RequestSentStateProps) {
  const who = displayName || 'The business owner';

  return (
    <div className={cn(
      'bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center animate-in fade-in zoom-in-95 duration-300',
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-2">Request sent ✓</h2>
      <p className="text-slate-500 mb-2">
        {who} will review your request and confirm by text.
      </p>
      <p className="text-sm text-slate-400 mb-8">
        You&apos;ll hear back shortly.
      </p>

      <div className="pt-6 border-t border-slate-100">
        <p className="text-sm text-slate-400 mb-3">Want your own booking profile?</p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Set up yours →
        </Link>
      </div>
    </div>
  );
}
