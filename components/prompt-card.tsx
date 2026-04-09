'use client';

import { PromptBlock } from '@/lib/types';
import { cn } from '@/lib/cn';

interface PromptCardProps {
  block: PromptBlock;
  className?: string;
}

export function PromptCard({ block, className }: PromptCardProps) {
  return (
    <div className={cn('bg-slate-50 rounded-2xl border border-slate-100 px-5 py-4', className)}>
      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">
        {block.prompt}
      </p>
      <p className="text-sm text-slate-700 leading-relaxed">
        {block.answer}
      </p>
    </div>
  );
}
