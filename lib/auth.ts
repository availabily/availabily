import { nanoid } from 'nanoid';
import { NextRequest } from 'next/server';

interface OTPEntry {
  code: string;
  expiresAt: number;
}

interface SessionEntry {
  userPhone: string;
  email: string;
  handle: string;
}

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// In-memory stores (persist for the lifetime of the server process)
const otpStore = new Map<string, OTPEntry>();
const sessionStore = new Map<string, SessionEntry>();

export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function storeOTP(email: string, code: string): void {
  otpStore.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
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

export function createSession(userPhone: string, email: string, handle: string): string {
  const token = nanoid(32);
  sessionStore.set(token, { userPhone, email, handle });
  return token;
}

export function getSessionUser(request: NextRequest): SessionEntry | null {
  const cookie = request.cookies.get('session');
  if (!cookie?.value) return null;
  return sessionStore.get(cookie.value) ?? null;
}

export function deleteSession(token: string): void {
  sessionStore.delete(token);
}
