import { BadRequestException } from '@nestjs/common';
import { prisma } from '@repo/database';
import { ErrorCode } from '@repo/shared';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How far before the first month's start a date may go. A mess often starts
 * using the app a few days into the month and back-fills, like meals do.
 * Later months begin the moment the previous one closes, so for them any
 * earlier date belongs to a closed month.
 */
export const FIRST_MONTH_GRACE_DAYS = 31;

const startOfUtcDay = (d: Date) =>
  Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

export interface MoneyDateMonth {
  id: string;
  mess_id: string;
  started_at: Date;
}

/** Pure check, for tests. `hasEarlierMonth`: a month closed before this one. */
export function moneyDateProblem(
  date: Date,
  month: Pick<MoneyDateMonth, 'started_at'>,
  hasEarlierMonth: boolean,
  now: Date = new Date(),
): 'invalid' | 'before-month' | 'future' | null {
  if (Number.isNaN(date.getTime())) return 'invalid';
  const day = startOfUtcDay(date);
  const earliest =
    startOfUtcDay(month.started_at) -
    (hasEarlierMonth ? 0 : FIRST_MONTH_GRACE_DAYS * DAY_MS);
  if (day < earliest) return 'before-month';
  // One day of slack: the client sends its local calendar day, which can be
  // a day ahead of UTC.
  if (day > startOfUtcDay(now) + DAY_MS) return 'future';
  return null;
}

/**
 * Rejects an expense, deposit or bazaar date that belongs to a closed month
 * (or lies before the first month's back-fill window) or is in the future.
 * Entries always go to the active month, so such a date would show up in the
 * wrong month's reports.
 */
export async function assertMoneyDateInMonth(
  date: Date,
  month: MoneyDateMonth,
): Promise<void> {
  const earlier = await prisma.months.count({
    where: {
      mess_id: month.mess_id,
      deleted_at: null,
      id: { not: month.id },
      started_at: { lt: month.started_at },
    },
  });
  const problem = moneyDateProblem(date, month, earlier > 0);
  if (!problem) return;
  throw new BadRequestException({
    message:
      problem === 'future'
        ? 'The date cannot be in the future.'
        : problem === 'invalid'
          ? 'The date is not valid.'
          : 'The date is before the current month started. Earlier months are closed; pick a date in this month.',
    code: ErrorCode.DATE_OUTSIDE_MONTH,
    details: {
      date: [
        problem === 'future'
          ? 'Date cannot be in the future'
          : 'Date must be in the current month',
      ],
    },
  });
}
