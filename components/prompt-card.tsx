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
        'relative bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] pl-6 pr-5 py-5 overflow-hidden',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.09)]',
        className
      )}
    >
      <span
        aria-hidden
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-gradient-to-b from-brand-400 to-brand-600"
      />
      <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.12em] mb-2">
        {block.prompt}
      </p>
      <p className="font-display text-[18px] leading-snug text-slate-900">
        {block.answer}
      </p>
    </div>
  );
}
