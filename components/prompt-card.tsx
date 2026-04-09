'use client';

import { PromptBlock } from '@/lib/types';
import { cn } from '@/lib/cn';

interface PromptCardProps {
  block: PromptBlock;
  className?: string;
}

export function PromptCard({ block, className }: PromptCardProps) {
  return (
    <div
      className={cn(
        'relative bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] pl-6 pr-5 py-6 overflow-hidden',
        className
      )}
    >
      <span
        aria-hidden
        className="absolute left-0 top-4 bottom-4 w-[3.5px] rounded-full bg-gradient-to-b from-brand-400 via-brand-500 to-violet-500"
      />
      <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-2.5">
        {block.prompt}
      </p>
      <p className="font-display text-[17px] leading-snug text-slate-900">
        {block.answer}
      </p>
    </div>
  );
}
