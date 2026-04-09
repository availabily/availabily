'use client';

import { DayAvailability } from '@/lib/types';
import { cn } from '@/lib/cn';

interface DaySelectorProps {
  days: DayAvailability[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

export function DaySelector({ days, selectedDate, onSelect }: DaySelectorProps) {
  return (
    <div className="touch-scroll-x flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {days.map((day) => {
        const date = new Date(day.date + 'T00:00:00');
        const dayOfMonth = date.getDate();
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const isSelected = selectedDate === day.date;
        const isEmpty = day.slots.length === 0;

        return (
          <button
            key={day.date}
            onClick={() => !isEmpty && onSelect(day.date)}
            disabled={isEmpty}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl px-4 py-3 min-w-[68px] snap-start transition-all duration-200 border',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
              isEmpty
                ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                : isSelected
                  ? 'bg-brand-600 border-brand-600 text-white shadow-[0_10px_24px_-8px_rgba(91,76,255,0.45)]'
                  : 'bg-white border-slate-100 text-slate-700 hover:border-brand-200 hover:bg-brand-50'
            )}
          >
            <span
              className={cn(
                'text-[11px] font-semibold uppercase tracking-wider',
                isSelected ? 'text-white/80' : isEmpty ? 'text-slate-300' : 'text-slate-400'
              )}
            >
              {dayName}
            </span>
            <span className="text-xl font-bold leading-tight mt-0.5">{dayOfMonth}</span>
          </button>
        );
      })}
    </div>
  );
}
