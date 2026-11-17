import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Which group of cached results an entry belongs to. Each group is cleared
 * on its own:
 * - `live`: anything derived from the active month (balances, meal rate,
 *   summaries). Cleared by every write to the mess.
 * - `closed`: reports of closed months. Their numbers never change, so only
 *   changes to people (names, avatars, removed members) clear them.
 */
export type CacheBucket = 'live' | 'closed';

const TTL_SECONDS: Record<CacheBucket, number> = {
  // Safety net only: every write clears the bucket straight away.
  live: 6 * 60 * 60,
  closed: 7 * 24 * 60 * 60,
};
// Version counters outlive every cached entry, so an expired counter can
// never make an old entry look current.
const VERSION_TTL_SECONDS = 30 * 24 * 60 * 60;
// Redis must never make a request slower than skipping the cache would.
const COMMAND_TIMEOUT_MS = 400;

type Entry<T> = { v: string; d: T };
type Lookup<T> =
  | { hit: true; value: T }
  | { hit: false; version: string | null };

/**
 * Read-through cache in Redis for computed mess data.
 *
 * Layout per mess and bucket:
 *   cache:{bucket}:{messId}  hash, one field per cached result
 *   ver:{bucket}:{messId}    counter, bumped on every invalidation
 *
 * Each entry stores the counter value it was computed under. A result that
 * was being computed while a write cleared the cache is therefore written
 * with an old version and ignored, instead of serving stale numbers.
 *
 * The cache fails open: without REDIS_URL, or when Redis is slow or down,
 * every call just runs the loader against the database.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis | null;
  private lastErrorLog = 0;

  constructor() {
    const url = process.env.REDIS_URL;
    this.redis = url
      ? new Redis(url, {
          maxRetriesPerRequest: 1,
          connectTimeout: 5000,
          commandTimeout: COMMAND_TIMEOUT_MS,
          // Retry the connection in the background, at most every 5s.
          retryStrategy: (times) => Math.min(times * 500, 5000),
        })
      : null;
    this.redis?.on('error', (err) => this.logError('connection', err));
  }

  async onModuleDestroy() {
    await this.redis?.quit().catch(() => undefined);
  }

  /** Returns the cached value, or runs `load`, caches and returns it. */
  async remember<T>(
    messId: string,
    bucket: CacheBucket,
    field: string,
    load: () => Promise<T>,
  ): Promise<T> {
    const found = await this.lookup<T>(messId, bucket, field);
    if (found.hit) return found.value;
    const value = await load();
    if (found.version !== null) {
      await this.store(messId, bucket, field, found.version, value);
    }
    return value;
  }

  /**
   * For results about one month: a closed month's result goes to the
   * long-lived `closed` bucket, an active month's to `live`. Both buckets
   * are checked in a single Redis round trip.
   */
  async rememberMonth<T>(
    messId: string,
    field: string,
    load: () => Promise<{ value: T; closed: boolean }>,
  ): Promise<T> {
    const [closed, live] = await this.lookupMany<T>(messId, field, [
      'closed',
      'live',
    ]);
    if (closed?.hit) return closed.value;
    if (live?.hit) return live.value;
    const { value, closed: isClosed } = await load();
    const miss = isClosed ? closed : live;
    if (miss && !miss.hit && miss.version !== null) {
      await this.store(
        messId,
        isClosed ? 'closed' : 'live',
        field,
        miss.version,
        value,
      );
    }
    return value;
  }

  /**
   * Looks an entry up. On a miss, `version` is the token to pass to
   * `store()` (null when Redis is unavailable: don't store).
   */
  async lookup<T>(
    messId: string,
    bucket: CacheBucket,
    field: string,
  ): Promise<Lookup<T>> {
    const [result] = await this.lookupMany<T>(messId, field, [bucket]);
    return result ?? { hit: false, version: null };
  }

  private async lookupMany<T>(
    messId: string,
    field: string,
    buckets: CacheBucket[],
  ): Promise<Lookup<T>[]> {
    const unavailable: Lookup<T>[] = buckets.map(() => ({
      hit: false,
      version: null,
    }));
    if (!this.redis) return unavailable;
    try {
      const tx = this.redis.multi();
      for (const bucket of buckets) {
        tx.get(versionKey(bucket, messId)).hget(hashKey(bucket, messId), field);
      }
      const res = await tx.exec();
      if (!res) return unavailable;
      return buckets.map((_, i): Lookup<T> => {
        const [verErr, ver] = res[i * 2] ?? [];
        const [rawErr, raw] = res[i * 2 + 1] ?? [];
        if (verErr || rawErr) return { hit: false, version: null };
        const version = (ver as string | null) ?? '0';
        if (typeof raw === 'string') {
          const entry = JSON.parse(raw) as Entry<T>;
          if (entry.v === version) return { hit: true, value: entry.d };
        }
        return { hit: false, version };
      });
    } catch (err) {
      this.logError('lookup', err);
      return unavailable;
    }
  }

  async store<T>(
    messId: string,
    bucket: CacheBucket,
    field: string,
    version: string,
    value: T,
  ): Promise<void> {
    if (!this.redis) return;
    const entry: Entry<T> = { v: version, d: value };
    const key = hashKey(bucket, messId);
    try {
      await this.redis
        .multi()
        .hset(key, field, JSON.stringify(entry))
        .expire(key, TTL_SECONDS[bucket])
        .exec();
    } catch (err) {
      this.logError('store', err);
    }
  }

  /** Clears the given buckets of each mess. */
  async invalidate(
    messIds: Iterable<string>,
    buckets: readonly CacheBucket[] = ['live'],
  ): Promise<void> {
    if (!this.redis) return;
    const tx = this.redis.multi();
    let any = false;
    for (const messId of new Set(messIds)) {
      for (const bucket of buckets) {
        any = true;
        tx.incr(versionKey(bucket, messId))
          .expire(versionKey(bucket, messId), VERSION_TTL_SECONDS)
          .del(hashKey(bucket, messId));
      }
    }
    if (!any) return;
    try {
      await tx.exec();
    } catch (err) {
      // The version bump failed, so readers may see old data until the
      // entry's TTL. Logged loudly; the write itself already succeeded.
      this.logError('invalidate', err);
    }
  }

  private logError(op: string, err: unknown) {
    // At most one line every 30s, so a Redis outage doesn't flood the logs.
    const now = Date.now();
    if (now - this.lastErrorLog < 30_000) return;
    this.lastErrorLog = now;
    console.error(
      JSON.stringify({
        level: 'warn',
        source: 'cache',
        op,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  }
}

const hashKey = (bucket: CacheBucket, messId: string) =>
  `cache:${bucket}:${messId}`;
const versionKey = (bucket: CacheBucket, messId: string) =>
  `ver:${bucket}:${messId}`;
