import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '@repo/shared';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How far before the month a meal date may be. Managers often start a month
 * a few days late and back-fill; anything further is almost certainly a
 * mistake.
 */
export const MEAL_DATE_GRACE_DAYS = 31;

/** Bangladesh is UTC+6 all year (no DST). */
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

/** UTC midnight of today's calendar date in Bangladesh. */
export function dhakaToday(now: Date): number {
  const local = new Date(now.getTime() + DHAKA_OFFSET_MS);
  return Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
  );
}

export interface MealEntryInput {
  memberId: string;
  date: string;
  meals: Record<string, number>;
}

export interface PreparedMealEntry {
  memberId: string;
  date: Date;
  meals: Record<string, number>;
  totalMeal: number;
}

export interface PrepareContext {
  /** Meal types of this mess that are not deleted (active or inactive). */
  liveMealTypeIds: Set<string>;
  /** Saved meals per `${memberId}|${date ISO}` for the dates being saved. */
  existingMeals: Map<string, Record<string, number>>;
  monthStartedAt: Date;
  now: Date;
}

export const entryKey = (memberId: string, date: Date) =>
  `${memberId}|${date.toISOString()}`;

function startOfUtcDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function invalid(message: string): never {
  throw new BadRequestException({
    message,
    code: ErrorCode.VALIDATION_FAILED,
  });
}

/**
 * Validates a bulk meal save and works out each row's total.
 *
 * - A date must be a calendar day (UTC midnight). Entries are unique per
 *   exact timestamp, so two times on the same day would create two rows and
 *   bill the member twice.
 * - Only days that have ended (yesterday or earlier, Bangladesh time) can be
 *   saved, so nobody bills meals that haven't been eaten yet.
 * - Every meal counts as 1 toward the bill; the meal type's `value` is only
 *   the default count the grid is pre-filled with.
 * - A deleted meal type may only appear with the count already saved for that
 *   day, so old days stay editable but deleted types can't gain meals.
 */
export function prepareMealEntries(
  entries: MealEntryInput[],
  ctx: PrepareContext,
): PreparedMealEntry[] {
  const earliest =
    startOfUtcDay(ctx.monthStartedAt) - MEAL_DATE_GRACE_DAYS * DAY_MS;
  const latest = dhakaToday(ctx.now) - DAY_MS;

  const seen = new Set<string>();

  return entries.map((entry) => {
    const date = new Date(entry.date);
    const time = date.getTime();
    if (Number.isNaN(time) || time !== startOfUtcDay(date)) {
      invalid('Meal dates must be a calendar day (YYYY-MM-DDT00:00:00Z)');
    }
    if (time > latest) {
      throw new BadRequestException({
        message: 'Meals can only be saved for past days',
        code: ErrorCode.MEAL_DATE_NOT_PAST,
      });
    }
    if (time < earliest) {
      invalid('Meal date is too far outside this month');
    }

    const key = entryKey(entry.memberId, date);
    if (seen.has(key)) {
      invalid('The same member and date appear more than once');
    }
    seen.add(key);

    const saved = ctx.existingMeals.get(key) ?? {};
    let totalMeal = 0;
    for (const [mealTypeId, quantity] of Object.entries(entry.meals)) {
      if (!ctx.liveMealTypeIds.has(mealTypeId)) {
        // Deleted (or foreign/unknown) type: only an unchanged saved count
        // is accepted.
        if (saved[mealTypeId] !== quantity) {
          invalid('Unknown meal type');
        }
      }
      totalMeal += quantity;
    }

    return { memberId: entry.memberId, date, meals: entry.meals, totalMeal };
  });
}
