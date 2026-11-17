import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { prisma } from '@repo/database';
import type { Request } from 'express';
import { catchError, concatMap, from, map, mergeMap, throwError } from 'rxjs';
import type { Observable } from 'rxjs';
import { INVALIDATES_KEY } from './cache.decorator';
import { CacheService, type CacheBucket } from './cache.service';

type AuthedRequest = Request & { user?: { id: string } };

/**
 * Clears cached mess data after every write, in one place, so no service
 * can forget to.
 *
 * - A write under `/:messId/...` clears that mess's `live` bucket.
 * - A write without `:messId` (profile, avatar, invites, creating a mess or
 *   a member account) clears both buckets of every mess the user belongs
 *   to, because it can change names or membership shown in any report.
 * - `@InvalidatesCache([...])` overrides the buckets for a route.
 *
 * The clear finishes before the response is sent, so the client's refetch
 * right after a successful write never reads the old cached result. Failed
 * requests with a 4xx status changed nothing and clear nothing.
 */
@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(
    private readonly cache: CacheService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (
      req.method === 'GET' ||
      req.method === 'HEAD' ||
      req.method === 'OPTIONS' ||
      req.path.startsWith('/auth')
    ) {
      return next.handle();
    }

    const override = this.reflector.getAllAndOverride<
      CacheBucket[] | undefined
    >(INVALIDATES_KEY, [context.getHandler(), context.getClass()]);

    const clear = () => from(this.clear(req, override));

    return next.handle().pipe(
      concatMap((data: unknown) => clear().pipe(map(() => data))),
      catchError((err: unknown) => {
        const isClientError =
          err instanceof HttpException && err.getStatus() < 500;
        if (isClientError) return throwError(() => err);
        // A server error may have happened after part of a write.
        return clear().pipe(mergeMap(() => throwError(() => err)));
      }),
    );
  }

  private async clear(
    req: AuthedRequest,
    override: CacheBucket[] | undefined,
  ): Promise<void> {
    const messId = req.params?.messId;
    if (typeof messId === 'string') {
      await this.cache.invalidate([messId], override ?? ['live']);
      return;
    }

    const userId = req.user?.id;
    if (!userId) return;
    try {
      const memberships = await prisma.mess_members.findMany({
        where: { user_id: userId },
        select: { mess_id: true },
      });
      await this.cache.invalidate(
        memberships.map((m) => m.mess_id),
        override ?? ['live', 'closed'],
      );
    } catch (err) {
      console.error(
        JSON.stringify({
          level: 'warn',
          source: 'cache',
          op: 'invalidate-lookup',
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }
}
