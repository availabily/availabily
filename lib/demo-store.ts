/**
 * In-memory store for demo mode.
 * Pre-seeded with a "demo" user (Mon–Fri, 9 AM – 5 PM, Pacific time).
 * Data persists for the lifetime of the dev server process.
 */

import { User, TimeRule, Meeting, Profile, ProfileImage, StripeAccount } from './types';

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

// ── Profile layer ──

const profiles: Profile[] = [
  {
    user_phone: DEMO_PHONE,
    display_name: 'Jake Martinez',
    business_name: "Jake's Mobile Detail",
    headline: 'Premium auto detailing in Maui',
    bio: 'I bring the shop to you. Full interior/exterior detail, ceramic coating, and paint correction — all done at your home or office.',
    avatar_url: '',
    gallery_urls: [],
    service_category: 'Auto Detailing',
    location: 'Lahaina, HI',
    trust_bullets: ['5-star rated', 'Licensed & insured', '500+ clients served'],
    prompt_blocks: [
      { id: 'pb-1', prompt: 'What people book me for', answer: 'Full interior/exterior details, ceramic coatings, and paint correction for daily drivers and luxury vehicles.' },
      { id: 'pb-2', prompt: 'What to expect', answer: 'I come to you fully equipped. Most details take 2–4 hours. You just pick a time and I handle the rest.' },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const profileImages: ProfileImage[] = [];

// ── Stripe accounts ──

const stripeAccounts: Map<string, StripeAccount> = new Map([
  [
    DEMO_PHONE,
    {
      user_phone: DEMO_PHONE,
      stripe_account_id: 'acct_demo_10000000000',
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
      onboarding_started_at: new Date().toISOString(),
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
]);

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

  getAllMeetings(): Meeting[] {
    return [...meetings];
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

  getMeetingById(id: string): Meeting | null {
    return meetings.find(m => m.id === id) ?? null;
  },

  getMeetingByQuoteToken(token: string): Meeting | null {
    return meetings.find(m => m.quote_token === token) ?? null;
  },

  getMeetingByAcceptToken(token: string): Meeting | null {
    return meetings.find(m => m.accept_token === token) ?? null;
  },

  getMeetingByManageToken(token: string): Meeting | null {
    return meetings.find(m => m.manage_token === token) ?? null;
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

  // ── Profile methods ──

  getProfile(userPhone: string): Profile | null {
    return profiles.find(p => p.user_phone === userPhone) ?? null;
  },

  getProfileByHandle(handle: string): Profile | null {
    const user = users.find(u => u.handle === handle);
    if (!user) return null;
    return profiles.find(p => p.user_phone === user.phone) ?? null;
  },

  upsertProfile(profile: Profile): void {
    const idx = profiles.findIndex(p => p.user_phone === profile.user_phone);
    const now = new Date().toISOString();
    if (idx !== -1) {
      profiles[idx] = { ...profile, updated_at: now, created_at: profiles[idx].created_at };
    } else {
      profiles.push({ ...profile, created_at: now, updated_at: now });
    }
  },

  // ── Profile image methods ──

  getProfileImages(userPhone: string): ProfileImage[] {
    return profileImages
      .filter(i => i.user_phone === userPhone)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  createProfileImage(image: ProfileImage): void {
    profileImages.push(image);
  },

  deleteProfileImage(id: string): void {
    const idx = profileImages.findIndex(i => i.id === id);
    if (idx !== -1) profileImages.splice(idx, 1);
  },

  reorderProfileImages(userPhone: string, orderedIds: string[]): void {
    orderedIds.forEach((id, index) => {
      const img = profileImages.find(i => i.id === id && i.user_phone === userPhone);
      if (img) img.sort_order = index;
    });
  },

  // ── Stripe account methods ──

  getStripeAccount(userPhone: string): StripeAccount | null {
    return stripeAccounts.get(userPhone) ?? null;
  },

  upsertStripeAccount(account: StripeAccount): void {
    stripeAccounts.set(account.user_phone, { ...account, updated_at: new Date().toISOString() });
  },
};
