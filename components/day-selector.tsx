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
    <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {days.map((day) => {
        const date = new Date(day.date + 'T00:00:00');
        const dayOfMonth = date.getDate();
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const isSelected = selectedDate === day.date;

        return (
          <button
            key={day.date}
            onClick={() => onSelect(day.date)}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl px-4 py-3 min-w-[72px] snap-start transition-all duration-200 border-2',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
              isSelected
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
            )}
          >
            <span className={cn('text-xs font-medium', isSelected ? 'text-indigo-100' : 'text-slate-400')}>
              {dayName}
            </span>
            <span className="text-lg font-bold leading-tight">{dayOfMonth}</span>
            <span className={cn('text-xs', isSelected ? 'text-indigo-100' : 'text-slate-400')}>
              {monthName}
            </span>
            <span className={cn(
              'mt-1 text-xs font-medium rounded-full px-2 py-0.5',
              isSelected ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-600'
            )}>
              {day.slots.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}
