import { SetMetadata } from '@nestjs/common';
import type { CacheBucket } from './cache.service';

export const INVALIDATES_KEY = 'cache:invalidates';

/**
 * Overrides which cache buckets a write clears (see
 * CacheInvalidationInterceptor for the defaults). Use `['live', 'closed']`
 * for writes that change people shown in closed-month reports, such as
 * removing a member or renaming a user.
 */
export const InvalidatesCache = (buckets: CacheBucket[]) =>
  SetMetadata(INVALIDATES_KEY, buckets);
