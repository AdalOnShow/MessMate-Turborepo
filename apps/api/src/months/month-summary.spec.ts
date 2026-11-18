import {
  allocateByMeals,
  computeMemberSummaries,
  roundMoney,
} from './month-summary';

const M = 'month-1';

describe('computeMemberSummaries', () => {
  it('splits bazaar by meals and charges SHARED/INDIVIDUAL only via allocations', () => {
    const { mealRate, rows } = computeMemberSummaries(M, {
      activeMemberIds: ['a', 'b'],
      mealEntries: [
        { member_id: 'a', total_meal: 30 },
        { member_id: 'b', total_meal: 10 },
      ],
      expenses: [
        { type: 'BAZAAR', amount: 4000, members: [] },
        {
          type: 'SHARED',
          amount: 1000,
          members: [
            { member_id: 'a', allocated_amount: 500 },
            { member_id: 'b', allocated_amount: 500 },
          ],
        },
        {
          type: 'INDIVIDUAL',
          amount: 200,
          members: [{ member_id: 'b', allocated_amount: 200 }],
        },
      ],
      deposits: [{ member_id: 'a', amount: 3000 }],
    });

    expect(mealRate).toBe(100);
    const a = rows.find((r) => r.member_id === 'a')!;
    const b = rows.find((r) => r.member_id === 'b')!;
    expect(a).toMatchObject({
      meal_cost: 3000,
      shared_cost: 500,
      final_bill: 3500,
      final_balance: -500,
    });
    expect(b).toMatchObject({
      meal_cost: 1000,
      shared_cost: 500,
      individual_cost: 200,
      final_bill: 1700,
      final_balance: -1700,
    });
    // Nothing is double counted: bills add up to all spending.
    expect(a.final_bill + b.final_bill).toBe(4000 + 1000 + 200);
  });

  it('still bills a member removed before the month closed', () => {
    const { rows } = computeMemberSummaries(M, {
      activeMemberIds: ['a'],
      mealEntries: [
        { member_id: 'a', total_meal: 10 },
        { member_id: 'gone', total_meal: 10 },
      ],
      expenses: [{ type: 'BAZAAR', amount: 2000, members: [] }],
      deposits: [],
    });
    expect(rows.map((r) => r.member_id).sort()).toEqual(['a', 'gone']);
    expect(rows.reduce((s, r) => s + r.meal_cost, 0)).toBe(2000);
  });

  it('folds carried balances in as deposit / individual cost (ADR-008)', () => {
    const { rows } = computeMemberSummaries(M, {
      activeMemberIds: ['a', 'b'],
      mealEntries: [],
      expenses: [],
      deposits: [],
      carries: [
        { member_id: 'a', amount: 300, carry_forward_type: 'PREVIOUS_BALANCE' },
        { member_id: 'b', amount: 150, carry_forward_type: 'PREVIOUS_DUE' },
      ],
    });
    expect(rows.find((r) => r.member_id === 'a')!.final_balance).toBe(300);
    expect(rows.find((r) => r.member_id === 'b')!.final_balance).toBe(-150);
  });

  it('handles a month with no meals and accepts Decimal-like strings', () => {
    const { mealRate, rows } = computeMemberSummaries(M, {
      activeMemberIds: ['a'],
      mealEntries: [],
      expenses: [{ type: 'BAZAAR', amount: '500.50', members: [] }],
      deposits: [{ member_id: 'a', amount: '100.10' }],
    });
    expect(mealRate).toBe(0);
    expect(rows[0]!.final_balance).toBe(100.1);
  });

  it('meal costs add up to the bazaar total exactly (no paisa drift)', () => {
    // ৳715 over 29.5 meals: rounding each share separately gave ৳714.99.
    const { rows } = computeMemberSummaries(M, {
      activeMemberIds: ['a', 'b', 'c', 'd'],
      mealEntries: [
        { member_id: 'a', total_meal: 6 },
        { member_id: 'b', total_meal: 5.5 },
        { member_id: 'c', total_meal: 9 },
        { member_id: 'd', total_meal: 9 },
      ],
      expenses: [
        { type: 'BAZAAR', amount: 715, members: [] },
        {
          type: 'SHARED',
          amount: 1000,
          members: [
            { member_id: 'a', allocated_amount: 333.33 },
            { member_id: 'b', allocated_amount: 333.33 },
            { member_id: 'c', allocated_amount: 333.34 },
          ],
        },
      ],
      deposits: [],
    });
    const paisa = (k: 'meal_cost' | 'final_bill') =>
      rows.reduce((s, r) => s + Math.round(r[k] * 100), 0);
    expect(paisa('meal_cost')).toBe(71500);
    expect(paisa('final_bill')).toBe(171500);
    for (const r of rows) {
      expect(r.meal_cost).toBe(roundMoney(r.meal_cost));
    }
  });

  it('allocateByMeals hands leftover paisa to the largest remainders', () => {
    // ৳100 over 3 equal eaters: 33.34 + 33.33 + 33.33, stable by id.
    const shares = allocateByMeals(
      100,
      new Map([
        ['c', 1],
        ['a', 1],
        ['b', 1],
      ]),
    );
    expect(shares.get('a')).toBe(33.34);
    expect(shares.get('b')).toBe(33.33);
    expect(shares.get('c')).toBe(33.33);
    expect(allocateByMeals(100, new Map([['a', 0]])).size).toBe(0);
  });

  it('rounds to paisa', () => {
    expect(roundMoney(1 / 3)).toBe(0.33);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });
});
