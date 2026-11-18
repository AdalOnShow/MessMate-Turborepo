jest.mock(
  '@repo/database',
  () => jest.requireActual('../../test/prisma-mock').databaseModule,
);

import { prismaMock, resetPrismaMock } from '../../test/prisma-mock';
import { describeActivities } from './activity-details';

const MESS = 'mess-1';
const actor = { id: 'u1', name: 'Sharif', avatar: null };
const row = (over: Record<string, unknown>) =>
  ({
    id: 'log-1',
    mess_id: MESS,
    month_id: null,
    actor_id: 'u1',
    action: 'EXPENSE_ADDED',
    entity_type: 'expenses',
    entity_id: 'exp-1',
    details: null,
    created_at: new Date('2026-11-17T10:00:00Z'),
    actor,
    ...over,
  }) as never;

describe('describeActivities', () => {
  beforeEach(resetPrismaMock);

  it('describes an expense from its record, scoped to the mess', async () => {
    prismaMock.expenses.findMany.mockResolvedValue([
      {
        id: 'exp-1',
        title: 'Gas Bill',
        amount: 1000,
        expense_date: new Date('2026-11-17T00:00:00Z'),
      },
    ]);
    const [item] = await describeActivities(MESS, [row({})]);
    expect(item!.details).toEqual({
      title: 'Gas Bill',
      amount: 1000,
      date: '2026-11-17T00:00:00.000Z',
    });
    expect(prismaMock.expenses.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['exp-1'] }, mess_id: MESS },
      }),
    );
    expect(item!.actor).toEqual(actor);
  });

  it('uses the saved snapshot for a deleted expense', async () => {
    prismaMock.expenses.findMany.mockResolvedValue([]);
    const [item] = await describeActivities(MESS, [
      row({
        action: 'EXPENSE_DELETED',
        details: { title: 'Laundry', amount: 300 },
      }),
    ]);
    expect(item!.details).toEqual({ title: 'Laundry', amount: 300 });
  });

  it('describes meal entries and gives null when nothing is known', async () => {
    prismaMock.meal_entries.findMany.mockResolvedValue([
      {
        id: 'meal-1',
        date: new Date('2026-11-01T00:00:00Z'),
        total_meal: 1.5,
        member: { user: { name: 'Rahim' } },
      },
    ]);
    const items = await describeActivities(MESS, [
      row({
        id: 'a',
        action: 'MEAL_ADDED',
        entity_type: 'meal_entries',
        entity_id: 'meal-1',
      }),
      row({
        id: 'b',
        action: 'MONTH_OPENED',
        entity_type: null,
        entity_id: null,
      }),
    ]);
    expect(items[0]!.details).toEqual({
      member: 'Rahim',
      date: '2026-11-01T00:00:00.000Z',
      meals: 1.5,
    });
    expect(items[1]!.details).toBeNull();
    expect(prismaMock.months.findMany).not.toHaveBeenCalled();
  });
});
