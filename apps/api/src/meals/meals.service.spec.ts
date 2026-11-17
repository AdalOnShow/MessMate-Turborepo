jest.mock(
  '@repo/database',
  () => jest.requireActual('../../test/prisma-mock').databaseModule,
);

import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
});
