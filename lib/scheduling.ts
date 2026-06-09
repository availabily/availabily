import { TimeRule, Meeting, TimeSlot, DayAvailability } from './types';
import { getNext14Days, getCurrentTimeInTz, getCurrentDateInTz } from './utils';

/** Granularity (minutes) for generating candidate booking start times. */
export const SLOT_GRANULARITY = 30;

/** Selectable booking durations in minutes: 30m, 1h, 1.5h, 2h, 3h, 4h, 6h, 8h. */
export const ALLOWED_DURATIONS = [30, 60, 90, 120, 180, 240, 360, 480];

/** Default booking duration when none is supplied (preserves legacy 1h behavior). */
export const DEFAULT_DURATION = 60;

/**
 * Parse "HH:MM" time string into minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Format minutes since midnight into a "HH:MM" string.
 */
function minutesToTime(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && e1 > s2;
}

/**
 * Get the day of week (0=Sunday, 6=Saturday) for a date string "YYYY-MM-DD"
 */
function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.getDay();
}

/**
 * Expand an available time range into candidate booking slots of a given
 * duration, stepping by `granularity`. A slot is only produced when the full
 * duration fits inside this single range (`current + durationMinutes <= end`),
 * so a booking never spans two disjoint available windows and `end_time` never
 * overflows past the range end (guaranteeing it stays <= "23:59").
 */
function expandToSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  granularity: number = SLOT_GRANULARITY
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current + durationMinutes <= end) {
    slots.push({
      start_time: minutesToTime(current),
      end_time: minutesToTime(current + durationMinutes),
    });
    current += granularity;
  }

  return slots;
}

/**
 * Compute available slots for a specific date
 */
export function computeSlotsForDate(
  dateStr: string,
  rules: TimeRule[],
  meetings: Meeting[],
  timezone: string,
  durationMinutes: number = DEFAULT_DURATION,
  currentDateStr?: string,
  currentTimeStr?: string
): TimeSlot[] {
  const dayOfWeek = getDayOfWeek(dateStr);

  // Step 1: Find available rules for this day
  const availableRules = rules.filter(rule => {
    if (rule.rule_type !== 'available') return false;
    if (rule.is_recurring) {
      return rule.day_of_week === dayOfWeek;
    } else {
      return rule.date === dateStr;
    }
  });

  // Step 2: Expand available rules into duration-sized candidate slots
  let slots: TimeSlot[] = [];
  for (const rule of availableRules) {
    slots.push(...expandToSlots(rule.start_time, rule.end_time, durationMinutes));
  }

  // Dedup by start_time (preserving each slot's real end_time) and sort
  const seen = new Set<string>();
  slots = slots
    .filter(s => (seen.has(s.start_time) ? false : (seen.add(s.start_time), true)))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Step 3: Remove slots that fall within any blocked time_rule for that day
  const blockedRules = rules.filter(rule => {
    if (rule.rule_type !== 'blocked') return false;
    if (rule.is_recurring) {
      return rule.day_of_week === dayOfWeek;
    } else {
      return rule.date === dateStr;
    }
  });

  slots = slots.filter(slot => {
    return !blockedRules.some(blocked =>
      timeRangesOverlap(slot.start_time, slot.end_time, blocked.start_time, blocked.end_time)
    );
  });

  // Step 4: Remove slots that overlap any confirmed meeting on that date
  const acceptedMeetings = meetings.filter(m =>
    m.meeting_date === dateStr && m.status === 'confirmed'
  );
  slots = slots.filter(slot => {
    return !acceptedMeetings.some(meeting =>
      timeRangesOverlap(slot.start_time, slot.end_time, meeting.start_time, meeting.end_time)
    );
  });

  // Step 5: Remove slots that overlap any pending meeting < 24h old on that date
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const recentPendingMeetings = meetings.filter(m => {
    if (m.meeting_date !== dateStr || m.status !== 'pending') return false;
    const createdAt = new Date(m.created_at);
    return createdAt > twentyFourHoursAgo;
  });

  slots = slots.filter(slot => {
    return !recentPendingMeetings.some(meeting =>
      timeRangesOverlap(slot.start_time, slot.end_time, meeting.start_time, meeting.end_time)
    );
  });

  // Step 6: If this is today, remove slots that have already passed
  const isToday = currentDateStr !== undefined && dateStr === currentDateStr;
  if (isToday && currentTimeStr) {
    const currentMinutes = timeToMinutes(currentTimeStr);
    slots = slots.filter(slot => timeToMinutes(slot.start_time) > currentMinutes);
  }

  return slots;
}

/**
 * Compute available slots for the next 14 days
 */
export function computeAvailability(
  rules: TimeRule[],
  meetings: Meeting[],
  timezone: string,
  durationMinutes: number = DEFAULT_DURATION
): DayAvailability[] {
  const days = getNext14Days(timezone);
  const currentDateStr = getCurrentDateInTz(timezone);
  const currentTimeStr = getCurrentTimeInTz(timezone);

  const result: DayAvailability[] = [];

  for (const dateStr of days) {
    const slots = computeSlotsForDate(
      dateStr,
      rules,
      meetings,
      timezone,
      durationMinutes,
      currentDateStr,
      currentTimeStr
    );

    if (slots.length > 0) {
      const date = new Date(dateStr + 'T00:00:00');
      result.push({
        date: dateStr,
        day_name: date.toLocaleDateString('en-US', { weekday: 'long' }),
        slots,
      });
    }
  }

  return result;
}

/**
 * Check if a specific slot is available
 */
export function isSlotAvailable(
  dateStr: string,
  startTime: string,
  rules: TimeRule[],
  meetings: Meeting[],
  timezone: string,
  durationMinutes: number = DEFAULT_DURATION
): boolean {
  const slots = computeSlotsForDate(dateStr, rules, meetings, timezone, durationMinutes);
  return slots.some(s => s.start_time === startTime);
}
