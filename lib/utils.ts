/**
 * Format a phone number from E.164 to a readable format
 * e.g., +18085553434 -> 808-555-3434
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    const num = digits.slice(1);
    return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Validate E.164 phone format
 */
export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Format time from "HH:MM" to "h:MM AM/PM"
 */
export function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${ampm}`;
}

/**
 * Format a date string "YYYY-MM-DD" to a short day name "Mon"
 */
export function formatShortDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Format a date string "YYYY-MM-DD" to a full day name "Monday"
 */
export function formatFullDay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Format a date for display, e.g. "Tuesday, March 15"
 */
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/**
 * Convert a phone number string to E.164 format
 * Assumes US numbers if no country code
 */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

/**
 * Get the next 14 days as date strings "YYYY-MM-DD" in a given timezone
 */
export function getNext14Days(timezone: string): string[] {
  const days: string[] = [];
  const now = new Date();

  // Get current date in owner's timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(now);

  for (let i = 0; i < 14; i++) {
    const d = new Date(todayStr + 'T00:00:00');
    d.setDate(d.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
  }
  return days;
}

/**
 * Get the current time as "HH:MM" in a given timezone
 */
export function getCurrentTimeInTz(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(now);
}

/**
 * Format cents to a dollar string — no trailing .00 for whole dollars.
 * e.g. 150000 → "$1,500", 123450 → "$1,234.50"
 */
export function formatAmountCents(cents: number): string {
  const wholeDollars = Math.floor(cents / 100);
  const remainingCents = cents % 100;
  const formatted = wholeDollars.toLocaleString('en-US');
  if (remainingCents === 0) return `$${formatted}`;
  return `$${formatted}.${String(remainingCents).padStart(2, '0')}`;
}

/**
 * Format a date string "YYYY-MM-DD" to a short label e.g. "Mon, Apr 20"
 */
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Get the current date as "YYYY-MM-DD" in a given timezone
 */
export function getCurrentDateInTz(timezone: string): string {
  const now = new Date();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Return the UTC offset in milliseconds for a given Date in a given IANA timezone.
 * Parses the "GMT±HH:MM" string from Intl.DateTimeFormat longOffset.
 */
function getTzOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: tz,
    timeZoneName: 'longOffset',
  }).formatToParts(date);
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0';
  // offsetPart looks like "GMT+5:30", "GMT-7", or "GMT"
  const match = offsetPart.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3] ?? '0', 10);
  return sign * (hours * 60 + minutes) * 60 * 1000;
}

/**
 * Compute the UTC ISO string for a meeting's end moment given local date, time, and IANA timezone.
 *
 * Example:
 *   computeEndsAt('2026-04-20', '17:00', 'America/Los_Angeles')
 *     → '2026-04-21T00:00:00.000Z'  (PDT = UTC-7)
 */
export function computeEndsAt(dateStr: string, endTime: string, timezone: string): string {
  const localStr = `${dateStr}T${endTime}:00`;
  // Treat the wall-clock time as UTC provisionally to get a Date object in range
  const asUtc = new Date(localStr + 'Z');
  const tzOffsetMs = getTzOffsetMs(asUtc, timezone);
  return new Date(asUtc.getTime() - tzOffsetMs).toISOString();
}
