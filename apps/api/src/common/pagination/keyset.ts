import { BadRequestException } from '@nestjs/common';
import { ValidationMessage } from '@repo/shared';

/**
 * Keyset ("load more") pagination for lists sorted newest first by
 * (day, created_at, id). The cursor is the last row's sort key, so a page
 * never skips or repeats rows when new ones are added meanwhile, which
 * OFFSET paging would.
 */
export type SortKey = { date: Date; createdAt: Date; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function invalidCursor(): never {
  throw new BadRequestException({
    message: 'Validation failed',
    details: { cursor: ValidationMessage.CURSOR_INVALID },
  });
}

export function encodeKeysetCursor(key: SortKey): string {
  return Buffer.from(
    JSON.stringify([
      key.date.toISOString(),
      key.createdAt.toISOString(),
      key.id,
    ]),
  ).toString('base64url');
}

export function decodeKeysetCursor(cursor: string): SortKey {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    invalidCursor();
  }
  if (!Array.isArray(parsed) || parsed.length !== 3) invalidCursor();
  const [date, createdAt, id] = parsed as unknown[];
  if (
    typeof date !== 'string' ||
    typeof createdAt !== 'string' ||
    typeof id !== 'string' ||
    !UUID.test(id)
  ) {
    invalidCursor();
  }
  const key = { date: new Date(date), createdAt: new Date(createdAt), id };
  if (Number.isNaN(key.date.getTime()) || Number.isNaN(key.createdAt.getTime()))
    invalidCursor();
  return key;
}

/**
 * Prisma `where` for rows strictly after `key` in (dateField desc,
 * created_at desc, id desc) order.
 */
export function afterKey<F extends string>(dateField: F, key: SortKey) {
  return {
    OR: [
      { [dateField]: { lt: key.date } },
      { [dateField]: key.date, created_at: { lt: key.createdAt } },
      { [dateField]: key.date, created_at: key.createdAt, id: { lt: key.id } },
    ],
  } as { OR: Record<string, unknown>[] };
}

/** The `orderBy` matching `afterKey`. */
export function newestFirst<F extends string>(dateField: F) {
  return [
    { [dateField]: 'desc' },
    { created_at: 'desc' },
    { id: 'desc' },
  ] as Record<string, 'desc'>[];
}

/** Splits `limit + 1` fetched rows into a page and its next cursor. */
export function toPage<T>(
  rows: T[],
  limit: number,
  keyOf: (row: T) => SortKey,
): { rows: T[]; nextCursor: string | null } {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return {
    rows: page,
    nextCursor: hasMore && last ? encodeKeysetCursor(keyOf(last)) : null,
  };
}
