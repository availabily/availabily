import { TimeRule, Meeting, TimeSlot, DayAvailability } from './types';
import { getNext14Days, getCurrentTimeInTz, getCurrentDateInTz } from './utils';

/**
 * Parse "HH:MM" time string into minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
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
 * Expand a time range into 60-minute slots
 */
function expandToSlots(startTime: string, endTime: string): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  while (current + 60 <= end) {
    const startH = Math.floor(current / 60);
    const startM = current % 60;
    const endH = Math.floor((current + 60) / 60);
    const endM = (current + 60) % 60;

    slots.push({
      start_time: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
      end_time: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
    });
    current += 60;
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

  // Step 2: Expand available rules into slots
  let slots: TimeSlot[] = [];
  for (const rule of availableRules) {
    slots.push(...expandToSlots(rule.start_time, rule.end_time));
  }

  // Remove duplicate slots
  const slotSet = new Set(slots.map(s => s.start_time));
  slots = Array.from(slotSet).sort().map(start => {
    const [h, m] = start.split(':').map(Number);
    const endH = Math.floor((h * 60 + m + 60) / 60);
    const endM = (h * 60 + m + 60) % 60;
    return {
      start_time: start,
      end_time: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
    };
  });

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
  timezone: string
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
  timezone: string
): boolean {
  const slots = computeSlotsForDate(dateStr, rules, meetings, timezone);
  return slots.some(s => s.start_time === startTime);
}
