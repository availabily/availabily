import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

// Browser client (uses anon key)
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Server client (uses service role key for elevated access)
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}
