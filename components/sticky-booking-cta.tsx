'use client';

import { cn } from '@/lib/cn';

interface StickyBookingCTAProps {
  visible: boolean;
  onClick: () => void;
  className?: string;
}

export function StickyBookingCTA({ visible, onClick, className }: StickyBookingCTAProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 md:hidden',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none',
        className
      )}
    >
      <div className="bg-white/95 backdrop-blur-md border-t border-slate-100 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <button
          onClick={onClick}
          className="w-full bg-gradient-to-r from-brand-600 to-violet-600 text-white font-semibold text-base px-6 py-3.5 rounded-2xl hover:from-brand-700 hover:to-violet-700 transition-all duration-200 shadow-[0_10px_24px_-8px_rgba(91,76,255,0.45)] active:scale-[0.98]"
        >
          Pick a time ✨
        </button>
      </div>
    </div>
  );
}
