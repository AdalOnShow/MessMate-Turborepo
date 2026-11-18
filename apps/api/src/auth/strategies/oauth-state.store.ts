import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';

export const OAUTH_STATE_COOKIE = 'oauth_state';
const STATE_TTL_MS = 10 * 60 * 1000;

type StoreCallback = (err: Error | null, state?: string) => void;
type VerifyCallback = (
  err: Error | null,
  ok: boolean,
  info?: { message: string },
) => void;

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    // The callback is a top-level redirect from Google: Lax cookies are sent.
    sameSite: 'lax' as const,
    path: '/auth/google',
  };
}

/**
 * OAuth `state` kept in a short-lived httpOnly cookie instead of a server
 * session (the API has none). The callback is accepted only when Google
 * returns the same random value the browser was given when the flow
 * started, so an attacker can't make a victim finish the attacker's login
 * (login CSRF).
 */
export class CookieStateStore {
  store(req: Request, callback: StoreCallback): void {
    const state = randomBytes(24).toString('base64url');
    (req.res as Response | undefined)?.cookie(OAUTH_STATE_COOKIE, state, {
      ...cookieOptions(),
      maxAge: STATE_TTL_MS,
    });
    callback(null, state);
  }

  verify(req: Request, provided: unknown, callback: VerifyCallback): void {
    const expected = readCookie(req, OAUTH_STATE_COOKIE);
    (req.res as Response | undefined)?.clearCookie(
      OAUTH_STATE_COOKIE,
      cookieOptions(),
    );
    const ok =
      typeof provided === 'string' &&
      typeof expected === 'string' &&
      provided.length === expected.length &&
      timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    if (!ok) {
      callback(null, false, { message: 'Invalid or expired sign-in request' });
      return;
    }
    callback(null, true);
  }
}
