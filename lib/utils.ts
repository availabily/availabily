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
