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
    <div className={cn('bg-white rounded-3xl border border-slate-100 shadow-sm p-6', className)} id="pick-a-time">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Pick a time</h2>

      {days.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-3xl mb-3">😴</div>
          <p className="text-sm text-slate-500">No open slots in the next 14 days. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          <DaySelector
            days={days}
            selectedDate={selectedDate}
            onSelect={onSelectDate}
          />

          {selectedDay && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <p className="text-sm font-medium text-slate-500 mb-3">
                {selectedDay.day_name} — {selectedDay.slots.length} slot{selectedDay.slots.length !== 1 ? 's' : ''} available
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
