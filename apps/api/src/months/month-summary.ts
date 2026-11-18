/**
 * Pure month-close maths, kept free of Prisma so it can be unit-tested.
 *
 * Meal rate = total BAZAAR spend / total meals eaten by everyone.
 * SHARED and INDIVIDUAL expenses are charged through their per-member
 * allocations only, so they are never counted twice (see e837ba5).
 */

type Numeric = number | string | { toString(): string };

export interface SummaryInputs {
  /** Members still in the mess (they get a row even with no activity). */
  activeMemberIds: string[];
  mealEntries: { member_id: string; total_meal: Numeric }[];
  expenses: {
    type: string;
    amount: Numeric;
    members: { member_id: string; allocated_amount: Numeric }[];
  }[];
  /** Must already exclude soft-deleted deposits. */
  deposits: { member_id: string; amount: Numeric }[];
  /**
   * Balances carried into this month (ADR-008): a previous balance counts
   * as a deposit, a previous due as an individual expense.
   */
  carries?: {
    member_id: string;
    amount: Numeric;
    // 'PREVIOUS_BALANCE' | 'PREVIOUS_DUE'
    carry_forward_type: string;
  }[];
}

export interface MemberSummaryRow {
  month_id: string;
  member_id: string;
  total_meals: number;
  meal_cost: number;
  shared_cost: number;
  individual_cost: number;
  deposit_amount: number;
  final_bill: number;
  final_balance: number;
}

/** Round to whole paisa so stored values match what people see. */
export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const num = (v: Numeric) => Number(v);

/**
 * Splits `total` taka across members in proportion to their meals, in whole
 * paisa, so the shares always add up to exactly `total`.
 *
 * Rounding each share on its own (meals x rate) drifted by a paisa or more:
 * ৳715 of bazaar came out as ৳714.99 of meal costs. Here every member gets
 * the floor of their exact share, and the paisa left over go one each to the
 * members with the largest remainders (largest remainder method). Ties go to
 * the lower member id so the result is stable across recomputations.
 *
 * Integer arithmetic only: meals are DECIMAL(10,2), so meals x 100 is a whole
 * number and `paisa * units` stays exact.
 */
export function allocateByMeals(
  total: number,
  meals: Map<string, number>,
): Map<string, number> {
  const out = new Map<string, number>();
  const totalPaisa = Math.round(total * 100);
  const units = [...meals.entries()]
    .map(([id, m]) => ({ id, units: Math.round(m * 100) }))
    .filter((u) => u.units > 0);
  const totalUnits = units.reduce((s, u) => s + u.units, 0);
  if (totalUnits === 0 || totalPaisa === 0) return out;

  const shares = units.map((u) => {
    const exact = totalPaisa * u.units;
    return {
      id: u.id,
      paisa: Math.floor(exact / totalUnits),
      rest: exact % totalUnits,
    };
  });
  let left = totalPaisa - shares.reduce((s, x) => s + x.paisa, 0);
  const byRemainder = [...shares].sort(
    (a, b) => b.rest - a.rest || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  for (const s of byRemainder) {
    if (left <= 0) break;
    s.paisa += 1;
    left -= 1;
  }
  for (const s of shares) out.set(s.id, s.paisa / 100);
  return out;
}

export function computeMemberSummaries(
  monthId: string,
  input: SummaryInputs,
): { mealRate: number; rows: MemberSummaryRow[] } {
  // Everyone who took part in the month gets a row, including members who
  // were removed before it closed. Otherwise their meals still raise the
  // meal rate for everyone else while their own bill disappears.
  const memberIds = new Set<string>(input.activeMemberIds);
  for (const e of input.mealEntries) memberIds.add(e.member_id);
  for (const d of input.deposits) memberIds.add(d.member_id);
  for (const x of input.expenses)
    for (const a of x.members) memberIds.add(a.member_id);
  for (const c of input.carries ?? []) memberIds.add(c.member_id);

  const meals = new Map<string, number>();
  let totalMeals = 0;
  for (const e of input.mealEntries) {
    const v = num(e.total_meal);
    totalMeals += v;
    meals.set(e.member_id, (meals.get(e.member_id) ?? 0) + v);
  }

  let bazaarTotal = 0;
  const shared = new Map<string, number>();
  const individual = new Map<string, number>();
  for (const x of input.expenses) {
    if (x.type === 'BAZAAR') {
      bazaarTotal += num(x.amount);
      continue;
    }
    const target =
      x.type === 'SHARED'
        ? shared
        : x.type === 'INDIVIDUAL'
          ? individual
          : null;
    if (!target) continue;
    for (const a of x.members) {
      target.set(
        a.member_id,
        (target.get(a.member_id) ?? 0) + num(a.allocated_amount),
      );
    }
  }

  const deposits = new Map<string, number>();
  for (const d of input.deposits) {
    deposits.set(d.member_id, (deposits.get(d.member_id) ?? 0) + num(d.amount));
  }

  for (const c of input.carries ?? []) {
    const amount = num(c.amount);
    if (c.carry_forward_type === 'PREVIOUS_BALANCE') {
      deposits.set(c.member_id, (deposits.get(c.member_id) ?? 0) + amount);
    } else {
      individual.set(c.member_id, (individual.get(c.member_id) ?? 0) + amount);
    }
  }

  const mealRate = totalMeals > 0 ? bazaarTotal / totalMeals : 0;
  const mealCosts = allocateByMeals(bazaarTotal, meals);

  const rows = [...memberIds].map((memberId) => {
    const memberMeals = meals.get(memberId) ?? 0;
    const mealCost = mealCosts.get(memberId) ?? 0;
    const sharedCost = roundMoney(shared.get(memberId) ?? 0);
    const individualCost = roundMoney(individual.get(memberId) ?? 0);
    const depositAmount = roundMoney(deposits.get(memberId) ?? 0);
    const finalBill = roundMoney(mealCost + sharedCost + individualCost);

    return {
      month_id: monthId,
      member_id: memberId,
      total_meals: memberMeals,
      meal_cost: mealCost,
      shared_cost: sharedCost,
      individual_cost: individualCost,
      deposit_amount: depositAmount,
      final_bill: finalBill,
      final_balance: roundMoney(depositAmount - finalBill),
    };
  });

  return { mealRate, rows };
}
