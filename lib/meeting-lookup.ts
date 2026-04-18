import { Meeting, User, Profile } from './types';
import { demoStore } from './demo-store';
import { createServerClient } from './supabase';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export async function getMeetingByQuoteToken(token: string): Promise<Meeting | null> {
  if (isDemo) return demoStore.getMeetingByQuoteToken(token);
  const supabase = createServerClient();
  const { data } = await supabase.from('meetings').select('*').eq('quote_token', token).maybeSingle();
  return data ?? null;
}

export async function getMeetingByAcceptToken(token: string): Promise<Meeting | null> {
  if (isDemo) return demoStore.getMeetingByAcceptToken(token);
  const supabase = createServerClient();
  const { data } = await supabase.from('meetings').select('*').eq('accept_token', token).maybeSingle();
  return data ?? null;
}

export async function getMeetingByManageToken(token: string): Promise<Meeting | null> {
  if (isDemo) return demoStore.getMeetingByManageToken(token);
  const supabase = createServerClient();
  const { data } = await supabase.from('meetings').select('*').eq('manage_token', token).maybeSingle();
  return data ?? null;
}

export async function getOwnerForMeeting(
  meeting: Meeting,
): Promise<{ user: User; profile: Profile | null }> {
  if (isDemo) {
    return {
      user: demoStore.getUserByPhone(meeting.user_phone)!,
      profile: demoStore.getProfile(meeting.user_phone),
    };
  }
  const supabase = createServerClient();
  const [{ data: user }, { data: profile }] = await Promise.all([
    supabase.from('users').select('*').eq('phone', meeting.user_phone).single(),
    supabase.from('profiles').select('*').eq('user_phone', meeting.user_phone).maybeSingle(),
  ]);
  return { user: user!, profile: profile ?? null };
}
