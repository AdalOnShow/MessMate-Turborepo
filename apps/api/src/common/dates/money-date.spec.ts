import { moneyDateProblem } from './money-date';

describe('moneyDateProblem', () => {
  const now = new Date('2026-12-10T15:00:00Z');
  // December started the moment November closed.
  const december = { started_at: new Date('2026-11-17T16:05:00Z') };

  it('accepts a date in the active month', () => {
    expect(
      moneyDateProblem(new Date('2026-12-05T00:00:00Z'), december, true, now),
    ).toBeNull();
  });

  it('accepts the day the month started', () => {
    expect(
      moneyDateProblem(new Date('2026-11-17T00:00:00Z'), december, true, now),
    ).toBeNull();
  });

  it('rejects a date in an already closed month', () => {
    expect(
      moneyDateProblem(new Date('2026-11-16T00:00:00Z'), december, true, now),
    ).toBe('before-month');
  });

  it('lets the first month back-fill', () => {
    expect(
      moneyDateProblem(new Date('2026-11-01T00:00:00Z'), december, false, now),
    ).toBeNull();
    expect(
      moneyDateProblem(new Date('2026-09-01T00:00:00Z'), december, false, now),
    ).toBe('before-month');
  });

  it('allows tomorrow (timezone slack) but not later', () => {
    expect(
      moneyDateProblem(new Date('2026-12-11T00:00:00Z'), december, true, now),
    ).toBeNull();
    expect(
      moneyDateProblem(new Date('2026-12-12T00:00:00Z'), december, true, now),
    ).toBe('future');
  });
});
