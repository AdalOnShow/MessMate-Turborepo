import { BadRequestException } from '@nestjs/common';
import {
  afterKey,
  decodeKeysetCursor,
  encodeKeysetCursor,
  toPage,
} from './keyset';

const ID = '11111111-1111-4111-8111-111111111111';
const key = {
  date: new Date('2026-11-10T00:00:00.000Z'),
  createdAt: new Date('2026-11-10T08:30:00.123Z'),
  id: ID,
};

describe('keyset pagination', () => {
  it('round-trips a cursor exactly (milliseconds included)', () => {
    expect(decodeKeysetCursor(encodeKeysetCursor(key))).toEqual(key);
  });

  it.each([
    ['not base64 json', 'garbage'],
    ['wrong shape', Buffer.from('{"a":1}').toString('base64url')],
    [
      'bad id',
      Buffer.from(JSON.stringify(['2026-11-10', '2026-11-10', 'x'])).toString(
        'base64url',
      ),
    ],
    [
      'bad date',
      Buffer.from(JSON.stringify(['nope', '2026-11-10', ID])).toString(
        'base64url',
      ),
    ],
  ])('rejects a tampered cursor (%s) with 400', (_label, cursor) => {
    expect(() => decodeKeysetCursor(cursor)).toThrow(BadRequestException);
  });

  it('continues strictly after the last row, with ties broken by created_at then id', () => {
    expect(afterKey('deposit_date', key)).toEqual({
      OR: [
        { deposit_date: { lt: key.date } },
        { deposit_date: key.date, created_at: { lt: key.createdAt } },
        {
          deposit_date: key.date,
          created_at: key.createdAt,
          id: { lt: ID },
        },
      ],
    });
  });

  it('returns a next cursor only when there is another page', () => {
    const rows = [1, 2, 3].map((n) => ({ n, ...key }));
    const keyOf = (r: typeof key) => r;
    expect(toPage(rows, 3, keyOf).nextCursor).toBeNull();
    const page = toPage(rows, 2, keyOf);
    expect(page.rows.map((r) => r.n)).toEqual([1, 2]);
    expect(page.nextCursor).toBe(encodeKeysetCursor(key));
  });
});
