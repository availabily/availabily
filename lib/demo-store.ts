/**
 * In-memory store for demo mode.
 * Pre-seeded with a "demo" user (Mon–Fri, 9 AM – 5 PM, Pacific time).
 * Data persists for the lifetime of the dev server process.
 */

import { User, TimeRule, Meeting } from './types';

const DEMO_PHONE = '+10000000000';
export const DEMO_HANDLE = 'demo';

const users: User[] = [
  {
    phone: DEMO_PHONE,
    handle: DEMO_HANDLE,
    timezone: 'America/Los_Angeles',
    created_at: new Date().toISOString(),
  },
];

// Monday–Friday 9 AM – 5 PM (day_of_week 1–5)
const timeRules: TimeRule[] = [1, 2, 3, 4, 5].map((dow, i) => ({
  id: `demo-rule-${i}`,
  user_phone: DEMO_PHONE,
  rule_type: 'available' as const,
  date: null,
  day_of_week: dow,
  start_time: '09:00',
  end_time: '17:00',
  is_recurring: true,
  created_at: new Date().toISOString(),
}));

const meetings: Meeting[] = [];

export const demoStore = {
  getUserByHandle(handle: string): User | null {
    return users.find(u => u.handle === handle) ?? null;
  },

  getUserByPhone(phone: string): User | null {
    return users.find(u => u.phone === phone) ?? null;
  },

  createUser(user: User): void {
    users.push(user);
  },

  getTimeRules(userPhone: string): TimeRule[] {
    return timeRules.filter(r => r.user_phone === userPhone);
  },

  createTimeRules(rules: Omit<TimeRule, 'id' | 'created_at'>[]): void {
    for (const rule of rules) {
      timeRules.push({
        ...rule,
        id: `rule-${Math.random().toString(36).slice(2)}`,
        created_at: new Date().toISOString(),
      });
    }
  },

  getMeetings(userPhone: string, fromDate: string, toDate: string): Meeting[] {
    return meetings.filter(
      m =>
        m.user_phone === userPhone &&
        m.meeting_date >= fromDate &&
        m.meeting_date <= toDate
    );
  },

  getMeetingsByDate(userPhone: string, date: string): Meeting[] {
    return meetings.filter(m => m.user_phone === userPhone && m.meeting_date === date);
  },

  getMeetingByToken(token: string): Meeting | null {
    return meetings.find(m => m.confirm_token === token) ?? null;
  },

  createMeeting(meeting: Meeting): void {
    meetings.push(meeting);
  },

  updateMeeting(id: string, data: Partial<Meeting>): void {
    const idx = meetings.findIndex(m => m.id === id);
    if (idx !== -1) {
      meetings[idx] = { ...meetings[idx], ...data };
    }
  },

  countPendingMeetings(userPhone: string, visitorPhone: string, since: string): number {
    return meetings.filter(
      m =>
        m.user_phone === userPhone &&
        m.visitor_phone === visitorPhone &&
        m.status === 'pending' &&
        m.created_at >= since
    ).length;
  },
};
