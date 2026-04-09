'use client';

import { DayAvailability } from '@/lib/types';
import { DaySelector } from '@/components/day-selector';
import { TimeSlotGrid } from '@/components/time-slot-grid';
import { cn } from '@/lib/cn';

interface AvailabilityCardProps {
  days: DayAvailability[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  selectedSlot: string | null;
  onSelectSlot: (startTime: string) => void;
  className?: string;
}

export function AvailabilityCard({
  days,
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
  className,
}: AvailabilityCardProps) {
  const selectedDay = days.find(d => d.date === selectedDate);

  return (
    <div
      id="pick-a-time"
      className={cn(
        'bg-white rounded-[24px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-6',
        className
      )}
    >
      <div className="mb-5">
        <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-[0.14em] mb-1">
          Availability
        </p>
        <h2 className="font-display text-2xl font-bold text-slate-900">Pick a time</h2>
      </div>

      {days.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-50 flex items-center justify-center">
            <svg
              className="w-7 h-7 text-brand-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="16" rx="3" />
              <path d="M8 3v4M16 3v4M3 11h18" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">No open slots in the next 14 days. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <DaySelector days={days} selectedDate={selectedDate} onSelect={onSelectDate} />

          {selectedDay && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <p className="text-xs font-medium text-slate-400 mb-3">
                {selectedDay.slots.length > 0
                  ? `${selectedDay.slots.length} open slot${selectedDay.slots.length !== 1 ? 's' : ''}`
                  : 'Nothing open on this day'}
              </p>
              <TimeSlotGrid
                slots={selectedDay.slots}
                selectedSlot={selectedSlot}
                onSelect={onSelectSlot}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
