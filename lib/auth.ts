/**
 * Custom OTP + session auth for business owners.
 * Uses in-memory stores (suitable for single-process deployments and demo mode).
 */

import { createServerClient } from '@/lib/supabase';
import { demoStore } from '@/lib/demo-store';
import { nanoid } from 'nanoid';

const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !process.env.NEXT_PUBLIC_SUPABASE_URL;

// ── OTP store ──────────────────────────────────────────────────────────────
const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
interface OTPEntry {
  code: string;
  expiresAt: number;
  email: string;
}

const otpStore = new Map<string, OTPEntry>();

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function storeOTP(email: string, code: string): void {
  otpStore.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + OTP_EXPIRATION_MS,
    email: email.toLowerCase(),
  });
}

export function verifyOTP(email: string, code: string): boolean {
  const entry = otpStore.get(email.toLowerCase());
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return false;
  }
  if (entry.code !== code) return false;
  otpStore.delete(email.toLowerCase());
  return true;
}

// ── Session store ──────────────────────────────────────────────────────────
interface SessionEntry {
  email: string;
  userPhone: string;
  handle: string;
}

const sessionStore = new Map<string, SessionEntry>();

export function createSession(email: string, userPhone: string, handle: string): string {
  const token = nanoid(32);
  sessionStore.set(token, { email, userPhone, handle });
  return token;
}

export function getSession(token: string): SessionEntry | null {
  return sessionStore.get(token) ?? null;
}

export function deleteSession(token: string): void {
  sessionStore.delete(token);
}

// ── Cookie helper ──────────────────────────────────────────────────────────
export async function getSessionFromCookies(
  cookies: { get: (name: string) => { value: string } | undefined }
): Promise<SessionEntry | null> {
  const cookie = cookies.get('session_token');
  if (!cookie?.value) return null;

  const session = getSession(cookie.value);
  if (session) return session;

  // Note: in-memory session store is lost on server restart.
  // The user will need to log in again after a restart.
  return null;
}

// ── User lookup by email ───────────────────────────────────────────────────
export async function getUserByEmail(
  email: string
): Promise<{ phone: string; handle: string; email: string } | null> {
  if (isDemo) {
    const user = demoStore.getUserByEmail(email.toLowerCase());
    if (!user) return null;
    return { phone: user.phone, handle: user.handle, email: user.email };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('users')
      .select('phone, handle, email')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
