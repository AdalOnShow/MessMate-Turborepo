jest.mock(
  '@repo/database',
  () => jest.requireActual('../../test/prisma-mock').databaseModule,
);

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '@repo/shared';
import { prismaMock, resetPrismaMock } from '../../test/prisma-mock';
import { rejectsWith } from '../../test/helpers';
import { MealsService } from './meals.service';

const MESS = 'mess-1';
const MONTH = 'month-1';

describe('MealsService', () => {
  const service = new MealsService();

  beforeEach(resetPrismaMock);

  it('daily report covers one UTC day, whatever the server time zone', async () => {
    prismaMock.meal_entries.findMany.mockResolvedValue([]);

    await service.getDailyMealReport(MESS, MONTH, '2026-11-17');

    const { where } = prismaMock.meal_entries.findMany.mock.calls[0][0];
    expect(where.date.gte.toISOString()).toBe('2026-11-17T00:00:00.000Z');
    expect(where.date.lt.toISOString()).toBe('2026-11-18T00:00:00.000Z');
    // The month must belong to the mess the guard checked.
    expect(where).toMatchObject({ month_id: MONTH, month: { mess_id: MESS } });
  });

  describe('deleteMealEntry', () => {
    it('is manager-only', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.deleteMealEntry(MESS, 'entry-1', 'member-user'),
        ForbiddenException,
        ErrorCode.MANAGER_ONLY,
      );
    });

    it('only finds entries in an active month of this mess', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({ id: 'mgr' });
      prismaMock.meal_entries.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.deleteMealEntry(MESS, 'entry-1', 'mgr-user'),
        NotFoundException,
      );
      expect(prismaMock.meal_entries.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'entry-1',
          deleted_at: null,
          month: { mess_id: MESS, month_status: 'ACTIVE', deleted_at: null },
        },
      });
    });
  });

  describe('bulkSaveMealEntries', () => {
    it('rejects members from another mess', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({ id: 'mgr' });
      prismaMock.months.findFirst.mockResolvedValue({
        id: MONTH,
        started_at: new Date('2026-11-01T00:00:00Z'),
      });
      prismaMock.meal_types.findMany.mockResolvedValue([]);
      prismaMock.mess_members.findMany.mockResolvedValue([]); // none match
      prismaMock.meal_entries.findMany.mockResolvedValue([]);

      await expect(
        service.bulkSaveMealEntries(MESS, MONTH, 'mgr-user', {
          entries: [
            {
              memberId: 'other-mess-member',
              date: '2026-11-10T00:00:00.000Z',
              meals: {},
            },
          ],
        }),
      ).rejects.toMatchObject({ status: 400 });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('saving a day twice', () => {
    const date = '2026-11-10T00:00:00.000Z';
    const dto = { entries: [{ memberId: 'm1', date, meals: { t1: 1 } }] };

    const arrange = (existing: { total_meal: number }[]) => {
      prismaMock.mess_members.findFirst.mockResolvedValue({ id: 'mgr' });
      prismaMock.months.findFirst.mockResolvedValue({
        id: MONTH,
        started_at: new Date('2026-11-01T00:00:00Z'),
      });
      prismaMock.meal_types.findMany.mockResolvedValue([{ id: 't1' }]);
      prismaMock.mess_members.findMany.mockResolvedValue([{ id: 'm1' }]);
      prismaMock.meal_entries.findMany.mockResolvedValue(
        existing.map((e, i) => ({
          id: `e${i}`,
          member_id: 'm1',
          date: new Date(date),
          meals: {},
          ...e,
        })),
      );
    };

    it('create refuses a day that already has meals and writes nothing', async () => {
      arrange([{ total_meal: 2 }]);
      await rejectsWith(
        service.bulkSaveMealEntries(MESS, MONTH, 'mgr-user', dto),
        ConflictException,
        ErrorCode.MEAL_ALREADY_SAVED,
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('logs one activity for the whole day, with member and meal counts', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({ id: 'mgr' });
      prismaMock.months.findFirst.mockResolvedValue({
        id: MONTH,
        started_at: new Date('2026-11-01T00:00:00Z'),
      });
      prismaMock.meal_types.findMany.mockResolvedValue([{ id: 't1' }]);
      prismaMock.mess_members.findMany.mockResolvedValue([
        { id: 'm1' },
        { id: 'm2' },
      ]);
      prismaMock.meal_entries.findMany.mockResolvedValue([]);
      prismaMock.meal_entries.create.mockResolvedValue({ id: 'new' });

      await service.bulkSaveMealEntries(MESS, MONTH, 'mgr-user', {
        entries: [
          { memberId: 'm1', date, meals: { t1: 1 } },
          { memberId: 'm2', date, meals: { t1: 1.5 } },
        ],
      });

      const { data } = prismaMock.activity_logs.createMany.mock.calls[0][0] as {
        data: Record<string, unknown>[];
      };
      expect(data).toHaveLength(1);
      expect(data[0]).toMatchObject({
        action: 'MEAL_ADDED',
        entity_type: 'meal_day',
        details: { date, members: 2, meals: 2.5 },
      });
    });

    it('edit refuses a day with nothing saved', async () => {
      arrange([]);
      await rejectsWith(
        service.updateMealDay(MESS, MONTH, 'mgr-user', dto),
        NotFoundException,
        ErrorCode.MEAL_ENTRY_NOT_FOUND,
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getMealDays (Reports "Load more")', () => {
    it('pages days newest first with meals per member', async () => {
      const d1 = new Date('2026-11-12T00:00:00.000Z');
      const d2 = new Date('2026-11-11T00:00:00.000Z');
      const d3 = new Date('2026-11-10T00:00:00.000Z');
      prismaMock.meal_entries.groupBy
        .mockResolvedValueOnce([
          { date: d1, _sum: { total_meal: 5 } },
          { date: d2, _sum: { total_meal: 3 } },
          { date: d3, _sum: { total_meal: 2 } },
        ])
        .mockResolvedValueOnce([{ date: d1 }, { date: d2 }, { date: d3 }]);
      prismaMock.meal_entries.findMany.mockResolvedValue([
        { date: d1, member_id: 'a', total_meal: 3 },
        { date: d1, member_id: 'b', total_meal: 2 },
        { date: d2, member_id: 'a', total_meal: 3 },
      ]);

      const page = await service.getMealDays(MESS, MONTH, { limit: 2 });

      expect(page.days).toEqual([
        { date: d1.toISOString(), total: 5, by_member: { a: 3, b: 2 } },
        { date: d2.toISOString(), total: 3, by_member: { a: 3 } },
      ]);
      expect(page.total_days).toBe(3);
      expect(page.next_cursor).toEqual(expect.any(String));

      // The next page starts strictly before the last day shown.
      prismaMock.meal_entries.groupBy
        .mockResolvedValueOnce([{ date: d3, _sum: { total_meal: 2 } }])
        .mockResolvedValueOnce([{ date: d1 }, { date: d2 }, { date: d3 }]);
      const next = await service.getMealDays(MESS, MONTH, {
        limit: 2,
        cursor: page.next_cursor!,
      });
      expect(prismaMock.meal_entries.groupBy).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          where: expect.objectContaining({ date: { lt: d2 } }),
        }),
      );
      expect(next.next_cursor).toBeNull();
    });

    it('rejects a tampered cursor with 400', async () => {
      await expect(
        service.getMealDays(MESS, MONTH, { limit: 8, cursor: 'garbage' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
