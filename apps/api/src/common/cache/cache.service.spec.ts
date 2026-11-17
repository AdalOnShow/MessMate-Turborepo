import { CacheService } from './cache.service';

/** Minimal in-memory stand-in for the ioredis commands the cache uses. */
class FakeRedis {
  strings = new Map<string, string>();
  hashes = new Map<string, Map<string, string>>();
  down = false;

  multi() {
    const ops: Array<() => unknown> = [];
    const tx = {
      get: (k: string) => (ops.push(() => this.strings.get(k) ?? null), tx),
      hget: (k: string, f: string) => (
        ops.push(() => this.hashes.get(k)?.get(f) ?? null),
        tx
      ),
      hset: (k: string, f: string, v: string) => (
        ops.push(() => {
          if (!this.hashes.has(k)) this.hashes.set(k, new Map());
          this.hashes.get(k)!.set(f, v);
          return 1;
        }),
        tx
      ),
      expire: () => (ops.push(() => 1), tx),
      incr: (k: string) => (
        ops.push(() => {
          const n = Number(this.strings.get(k) ?? '0') + 1;
          this.strings.set(k, String(n));
          return n;
        }),
        tx
      ),
      del: (k: string) => (ops.push(() => this.hashes.delete(k)), tx),
      exec: () =>
        this.down
          ? Promise.reject(new Error('connection lost'))
          : Promise.resolve(ops.map((op) => [null, op()])),
    };
    return tx;
  }
}

function setup() {
  const service = new CacheService();
  const redis = new FakeRedis();
  Object.defineProperty(service, 'redis', { value: redis });
  return { service, redis };
}

describe('CacheService', () => {
  const MESS = 'mess-1';

  it('runs the loader once and serves the cached value after', async () => {
    const { service } = setup();
    const load = jest.fn().mockResolvedValue({ total: 1 });

    expect(await service.remember(MESS, 'live', 'calc', load)).toEqual({
      total: 1,
    });
    expect(await service.remember(MESS, 'live', 'calc', load)).toEqual({
      total: 1,
    });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('caches null results', async () => {
    const { service } = setup();
    const load = jest.fn().mockResolvedValue(null);

    await service.remember(MESS, 'live', 'active-month', load);
    expect(await service.remember(MESS, 'live', 'active-month', load)).toBe(
      null,
    );
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('recomputes after invalidation', async () => {
    const { service } = setup();
    const load = jest
      .fn()
      .mockResolvedValueOnce('old')
      .mockResolvedValueOnce('new');

    await service.remember(MESS, 'live', 'calc', load);
    await service.invalidate([MESS]);
    expect(await service.remember(MESS, 'live', 'calc', load)).toBe('new');
  });

  it('ignores a result computed while a write invalidated the cache', async () => {
    const { service } = setup();

    // The loader reads the database, then a write lands before it stores.
    const stale = service.remember(MESS, 'live', 'calc', async () => {
      await service.invalidate([MESS]);
      return 'stale';
    });
    expect(await stale).toBe('stale');

    const load = jest.fn().mockResolvedValue('fresh');
    expect(await service.remember(MESS, 'live', 'calc', load)).toBe('fresh');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps other messes cached when one is invalidated', async () => {
    const { service } = setup();
    await service.remember('a', 'live', 'calc', () => Promise.resolve('A'));
    await service.remember('b', 'live', 'calc', () => Promise.resolve('B'));

    await service.invalidate(['a']);

    const loadB = jest.fn();
    expect(await service.remember('b', 'live', 'calc', loadB)).toBe('B');
    expect(loadB).not.toHaveBeenCalled();
  });

  describe('rememberMonth', () => {
    it('keeps closed-month results across live invalidations', async () => {
      const { service } = setup();
      const load = jest
        .fn()
        .mockResolvedValue({ value: 'report', closed: true });

      await service.rememberMonth(MESS, 'summary:m1', load);
      await service.invalidate([MESS], ['live']);
      expect(await service.rememberMonth(MESS, 'summary:m1', load)).toBe(
        'report',
      );
      expect(load).toHaveBeenCalledTimes(1);

      await service.invalidate([MESS], ['live', 'closed']);
      await service.rememberMonth(MESS, 'summary:m1', load);
      expect(load).toHaveBeenCalledTimes(2);
    });

    it('clears active-month results on a live invalidation', async () => {
      const { service } = setup();
      const load = jest
        .fn()
        .mockResolvedValue({ value: 'running', closed: false });

      await service.rememberMonth(MESS, 'summary:m2', load);
      await service.invalidate([MESS], ['live']);
      await service.rememberMonth(MESS, 'summary:m2', load);
      expect(load).toHaveBeenCalledTimes(2);
    });
  });

  it('falls back to the loader when Redis is down', async () => {
    const { service, redis } = setup();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    redis.down = true;
    const load = jest.fn().mockResolvedValue('db');

    expect(await service.remember(MESS, 'live', 'calc', load)).toBe('db');
    await expect(service.invalidate([MESS])).resolves.toBeUndefined();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('runs the loader every time without REDIS_URL', async () => {
    const service = new CacheService();
    const load = jest.fn().mockResolvedValue('db');

    await service.remember(MESS, 'live', 'calc', load);
    await service.remember(MESS, 'live', 'calc', load);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
