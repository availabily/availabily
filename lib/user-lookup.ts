import { User } from './types';
import { demoStore } from './demo-store';
import { createServerClient } from './supabase';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/**
 * Resolve a business owner by their secret manage_token.
 * This is the key that authorizes profile edits via /account/[token] — never
 * the public handle. Returns null for an unknown or empty token.
 */
export async function getUserByManageToken(token: string): Promise<User | null> {
  if (!token) return null;
  if (isDemo) return demoStore.getUserByManageToken(token);
  const supabase = createServerClient();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('manage_token', token)
    .maybeSingle();
  return data ?? null;
}
