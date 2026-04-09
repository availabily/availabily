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
    <div className="grid grid-cols-3 gap-2.5">
      {slots.map((slot) => {
        const isSelected = selectedSlot === slot.start_time;
        return (
          <button
            key={slot.start_time}
            onClick={() => onSelect(slot.start_time)}
            aria-pressed={isSelected}
            className={cn(
              'rounded-2xl border px-3 py-3 text-sm font-semibold transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
              'active:scale-[0.97]',
              isSelected
                ? 'bg-brand-600 border-brand-600 text-white animate-[pulse-glow_2.2s_ease-in-out_infinite]'
                : 'bg-white border-slate-100 text-slate-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
            )}
          >
            {formatTime(slot.start_time)}
          </button>
        );
      })}
    </div>
  );
}
