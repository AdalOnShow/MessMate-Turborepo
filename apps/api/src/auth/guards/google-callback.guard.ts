import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google callback: a failed check (bad/missing OAuth state, user cancelled
 * at Google) becomes an `{ error }` user, so the controller redirects to the
 * sign-in page with a message instead of showing a bare 401 JSON page.
 */
@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
  handleRequest<TUser = unknown>(err: unknown, user: unknown): TUser {
    if (err || !user) {
      return {
        error: 'google_auth_failed',
        message: 'Google sign-in could not be completed',
      } as TUser;
    }
    return user as TUser;
  }
}
