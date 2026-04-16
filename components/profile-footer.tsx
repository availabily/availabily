'use client';

import Link from 'next/link';
import { cn } from '@/lib/cn';

interface ProfileFooterProps {
  className?: string;
}

export function ProfileFooter({ className }: ProfileFooterProps) {
  return (
    <footer className={cn('text-center py-6', className)}>
      <div className="flex items-center justify-center gap-1.5 mb-3">
        <span className="text-xs text-slate-400">Powered by</span>
        <Link
          href="/"
          className="text-xs font-bold tracking-tight hover:opacity-70 transition-opacity"
        >
          <span className="text-brand-500">AM</span>
          <span className="text-slate-500"> or </span>
          <span className="text-brand-500">PM?</span>
        </Link>
      </div>
      <div className="flex items-center justify-center gap-4">
        <Link
          href="/signup"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
        >
          Create your profile →
        </Link>
        <span className="text-slate-200" aria-hidden>|</span>
        <Link
          href="/privacy"
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Privacy
        </Link>
      </div>
    </footer>
  );
}
