'use client';

import { TimeSlot } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import { cn } from '@/lib/cn';

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: string | null;
  onSelect: (startTime: string) => void;
}

export function TimeSlotGrid({ slots, selectedSlot, onSelect }: TimeSlotGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.start_time;
        return (
          <button
            key={slot.start_time}
            onClick={() => onSelect(slot.start_time)}
            className={cn(
              'rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
              'active:scale-[0.97]',
              isSelected
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'bg-white border-slate-100 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700'
            )}
          >
            {formatTime(slot.start_time)}
          </button>
        );
      })}
    </div>
  );
}
