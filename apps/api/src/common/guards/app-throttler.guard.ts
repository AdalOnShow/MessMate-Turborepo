import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex').slice(0, 32);

type ThrottleRequest = {
  headers?: Record<string, unknown>;
  body?: unknown;
  ip?: unknown;
  path?: unknown;
};

/**
 * Picks who a request is counted against.
 *
 * The web app calls this API from Next.js server actions, so every user
 * arrives from the same address (the web host). Counting by IP would put the
 * whole site in one bucket: five wrong passwords from anyone would lock
 * everybody out of signing in. So:
 * - signed-in requests count per access token,
 * - sign-in and sign-up count per email address (limits guessing one
 *   account's password without blocking anyone else),
 * - refresh and logout count per refresh cookie,
 * - anything else falls back to the IP.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    return Promise.resolve(trackerFor(req as ThrottleRequest));
  }
}

const CREDENTIAL_ROUTES = new Set(['/auth/signin', '/auth/signup']);
const SESSION_ROUTES = new Set(['/auth/refresh', '/auth/logout']);

function normalizePath(path: unknown): string {
  if (typeof path !== 'string') return '';
  const clean = path.split('?')[0] ?? '';
  return clean.length > 1 ? clean.replace(/\/+$/, '') : clean;
}

function emailTracker(req: ThrottleRequest): string | null {
  const body = req.body as { email?: unknown } | undefined;
  if (body && typeof body.email === 'string' && body.email.trim()) {
    return `email:${digest(body.email.trim().toLowerCase())}`;
  }
  return null;
}

function sessionTracker(req: ThrottleRequest): string | null {
  const cookie = req.headers?.cookie;
  if (typeof cookie === 'string') {
    const match = /(?:^|;\s*)refresh_token=([^;]+)/.exec(cookie);
    if (match?.[1]) return `session:${digest(match[1])}`;
  }
  return null;
}

function ipTracker(req: ThrottleRequest): string {
  return typeof req.ip === 'string' ? `ip:${req.ip}` : 'ip:unknown';
}

export function trackerFor(req: ThrottleRequest): string {
  const path = normalizePath(req.path);

  // Sign-in/sign-up must never be keyed on a client-supplied header:
  // a random `Authorization: Bearer <x>` per attempt would otherwise give
  // every password guess a fresh bucket.
  if (CREDENTIAL_ROUTES.has(path)) {
    return emailTracker(req) ?? ipTracker(req);
  }
  if (SESSION_ROUTES.has(path)) {
    return sessionTracker(req) ?? ipTracker(req);
  }

  const auth = req.headers?.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return `token:${digest(auth.slice(7))}`;
  }

  return emailTracker(req) ?? sessionTracker(req) ?? ipTracker(req);
}
