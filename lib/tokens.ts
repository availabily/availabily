import { nanoid } from 'nanoid';

/**
 * Generate a 24-character URL-safe token.
 * Used independently for quote_token, accept_token, and manage_token —
 * each meeting gets three separate calls so each token is unique.
 */
export function generateToken(): string {
  return nanoid(24);
}
