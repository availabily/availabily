import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      console.warn('[session] SESSION_SECRET is not set — using insecure default. Set this in production.');
    }
    return 'dev-secret-change-me';
  }
  return secret;
}

export function createSessionToken(phone: string): string {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `${phone}|${exp}`;
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    // format: phone|exp|sig
    const parts = decoded.split('|');
    if (parts.length < 3) return null;
    const sig = parts[parts.length - 1];
    const payload = parts.slice(0, parts.length - 1).join('|');
    const expected = createHmac('sha256', getSecret()).update(payload).digest('hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    const sigBuf = Buffer.from(sig, 'hex');
    if (expectedBuf.length !== sigBuf.length || !timingSafeEqual(expectedBuf, sigBuf)) {
      return null;
    }
    const exp = parseInt(parts[1], 10);
    if (isNaN(exp) || Date.now() > exp) return null;
    return parts[0]; // phone
  } catch {
    return null;
  }
}

export async function getSessionPhone(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getSessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_MAX_AGE,
    path: '/',
  };
}
