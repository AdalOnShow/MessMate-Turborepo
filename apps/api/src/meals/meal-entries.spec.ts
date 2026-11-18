import { BadRequestException } from '@nestjs/common';
import {
  entryKey,
  prepareMealEntries,
  type PrepareContext,
} from './meal-entries';

const LUNCH = '11111111-1111-4111-8111-111111111111';
const DINNER = '22222222-2222-4222-8222-222222222222';
const DELETED = '33333333-3333-4333-8333-333333333333';
const MEMBER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const ctx = (over: Partial<PrepareContext> = {}): PrepareContext => ({
  liveMealTypeIds: new Set([LUNCH, DINNER]),
  existingMeals: new Map(),
  monthStartedAt: new Date('2026-11-01T08:30:00Z'),
  now: new Date('2026-11-17T10:00:00Z'),
  ...over,
});

// `now` is 16:00 on Nov 17 in Bangladesh, so Nov 16 is the latest past day.
const day = '2026-11-16T00:00:00.000Z';

function expectRejected(fn: () => unknown, message: string) {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(BadRequestException);
    expect((e as BadRequestException).getResponse()).toMatchObject({
      message,
    });
    return;
  }
  throw new Error('expected a BadRequestException');
}

describe('prepareMealEntries', () => {
  it('counts every meal as 1, including half meals', () => {
    const [row] = prepareMealEntries(
      [{ memberId: MEMBER, date: day, meals: { [LUNCH]: 1, [DINNER]: 1.5 } }],
      ctx(),
    );
    expect(row!.totalMeal).toBe(2.5);
    expect(row!.date.toISOString()).toBe(day);
  });

  it('rejects a time of day, which would create a second row for the same day', () => {
    expectRejected(
      () =>
        prepareMealEntries(
          [
            {
              memberId: MEMBER,
              date: '2026-11-16T18:00:00.000Z',
              meals: { [LUNCH]: 1 },
            },
          ],
          ctx(),
        ),
      'Meal dates must be a calendar day (YYYY-MM-DDT00:00:00Z)',
    );
  });

  it('rejects dates far before the month', () => {
    expectRejected(
      () =>
        prepareMealEntries(
          [
            {
              memberId: MEMBER,
              date: '2026-09-01T00:00:00.000Z', // > 31 days before the month started
              meals: { [LUNCH]: 1 },
            },
          ],
          ctx(),
        ),
      'Meal date is too far outside this month',
    );
  });

  it('rejects today and upcoming days (Bangladesh time)', () => {
    for (const date of [
      '2026-11-17T00:00:00.000Z', // today
      '2026-11-18T00:00:00.000Z', // tomorrow
      '2027-01-30T00:00:00.000Z',
    ]) {
      expectRejected(
        () =>
          prepareMealEntries(
            [{ memberId: MEMBER, date, meals: { [LUNCH]: 1 } }],
            ctx(),
          ),
        'Meals can only be saved for past days',
      );
    }
  });

  it('uses the Bangladesh date, not the UTC date', () => {
    // 01:00 on Nov 18 in Dhaka is still Nov 17 in UTC: Nov 17 has ended.
    const lateNight = ctx({ now: new Date('2026-11-17T19:00:00Z') });
    const entry = (date: string) => [
      { memberId: MEMBER, date, meals: { [LUNCH]: 1 } },
    ];
    expect(() =>
      prepareMealEntries(entry('2026-11-17T00:00:00.000Z'), lateNight),
    ).not.toThrow();
    expectRejected(
      () => prepareMealEntries(entry('2026-11-18T00:00:00.000Z'), lateNight),
      'Meals can only be saved for past days',
    );
  });

  it('allows back-filling a few days before the month started', () => {
    expect(() =>
      prepareMealEntries(
        [
          {
            memberId: MEMBER,
            date: '2026-10-29T00:00:00.000Z',
            meals: { [LUNCH]: 1 },
          },
        ],
        ctx(),
      ),
    ).not.toThrow();
  });

  it('rejects the same member and day twice', () => {
    const e = { memberId: MEMBER, date: day, meals: { [LUNCH]: 1 } };
    expectRejected(
      () => prepareMealEntries([e, e], ctx()),
      'The same member and date appear more than once',
    );
  });

  it('rejects meal types that are not in this mess', () => {
    expectRejected(
      () =>
        prepareMealEntries(
          [{ memberId: MEMBER, date: day, meals: { [DELETED]: 1 } }],
          ctx(),
        ),
      'Unknown meal type',
    );
  });

  it('keeps a deleted type that is resent unchanged, so old days stay editable', () => {
    const existingMeals = new Map([
      [entryKey(MEMBER, new Date(day)), { [LUNCH]: 1, [DELETED]: 1 }],
    ]);
    const [row] = prepareMealEntries(
      [
        {
          memberId: MEMBER,
          date: day,
          meals: { [LUNCH]: 2, [DELETED]: 1 },
        },
      ],
      ctx({ existingMeals }),
    );
    expect(row!.totalMeal).toBe(3);
  });

  it('does not let a deleted type gain meals', () => {
    const existingMeals = new Map([
      [entryKey(MEMBER, new Date(day)), { [DELETED]: 1 }],
    ]);
    expectRejected(
      () =>
        prepareMealEntries(
          [{ memberId: MEMBER, date: day, meals: { [DELETED]: 2 } }],
          ctx({ existingMeals }),
        ),
      'Unknown meal type',
    );
  });
});
