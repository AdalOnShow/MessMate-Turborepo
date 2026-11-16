import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limit key per signed-in user instead of per IP.
 *
 * The web app calls this API from Next.js server actions, so every user
 * arrives from the same address (the web host). Keyed by IP, the whole site
 * shares one bucket and normal page loads exhaust it. Requests carrying a
 * bearer token are bucketed by that token; anonymous requests (signin,
 * signup, refresh) still fall back to the IP.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const headers = req.headers as Record<string, unknown> | undefined;
    const header = headers?.authorization;

    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      const digest = createHash('sha256')
        .update(header.slice(7))
        .digest('hex')
        .slice(0, 32);
      return Promise.resolve(`token:${digest}`);
    }

    return Promise.resolve(typeof req.ip === 'string' ? req.ip : 'unknown');
  }
}
