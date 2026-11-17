jest.mock(
  '@repo/database',
  () => jest.requireActual('../../test/prisma-mock').databaseModule,
);

import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ErrorCode } from '@repo/shared';
import { prismaMock, resetPrismaMock } from '../../test/prisma-mock';
import { rejectsWith, daysAgo } from '../../test/helpers';
import { MonthsService } from './months.service';

const MESS = 'mess-1';
const MANAGER = 'manager-user';
const OCT = 'month-oct';

const monthRow = (over: Record<string, unknown> = {}) => ({
  id: 'month-nov',
  mess_id: MESS,
  title: 'November 2026',
  month_status: 'ACTIVE',
  started_at: new Date(),
  ended_at: null,
  created_by: MANAGER,
  created_at: new Date(),
  updated_at: new Date(),
  ...over,
});

/** Stubs everything closing October and opening November reads. */
function stubClose({ pendingBazaar = [] as { id: string }[] } = {}) {
  prismaMock.mess_members.findFirst.mockResolvedValue({ id: 'mgr' });
  prismaMock.months.findFirst.mockResolvedValue(
    monthRow({ id: OCT, title: 'October 2026', started_at: daysAgo(30) }),
  );
  prismaMock.months.findMany.mockResolvedValue([]);
  prismaMock.months.updateMany.mockResolvedValue({ count: 1 });
  prismaMock.months.create.mockResolvedValue(monthRow());
  prismaMock.bazaar_submissions.findMany.mockResolvedValue(pendingBazaar);
  prismaMock.mess_members.findMany.mockResolvedValue([]);
  prismaMock.meal_entries.findMany.mockResolvedValue([]);
  prismaMock.expenses.findMany.mockResolvedValue([]);
  prismaMock.deposits.findMany.mockResolvedValue([]);
  prismaMock.carry_forward_balances.findMany.mockResolvedValue([]);
}

describe('MonthsService', () => {
  const service = new MonthsService();

  beforeEach(resetPrismaMock);

  describe('createMonth (closes the active one)', () => {
    it('is manager-only', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.createMonth(MESS, 'member-user'),
        ForbiddenException,
        ErrorCode.MANAGER_ONLY,
      );
    });

    it('rejects pending bazaar of the closing month, in the same transaction', async () => {
      stubClose({ pendingBazaar: [{ id: 'b1' }, { id: 'b2' }] });

      await service.createMonth(MESS, MANAGER, 'November 2026');

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.bazaar_submissions.findMany).toHaveBeenCalledWith({
        where: { month_id: OCT, status: 'PENDING', deleted_at: null },
        select: { id: true },
      });
      expect(prismaMock.bazaar_submissions.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['b1', 'b2'] }, status: 'PENDING' },
        data: expect.objectContaining({
          status: 'REJECTED',
          approved_by: MANAGER,
        }),
      });
      const { data: logs } = prismaMock.activity_logs.createMany.mock
        .calls[0][0] as { data: { action: string; entity_id: string }[] };
      expect(logs.map((l) => [l.action, l.entity_id])).toEqual([
        ['BAZAAR_REJECTED', 'b1'],
        ['BAZAAR_REJECTED', 'b2'],
      ]);
      // The month is claimed (archived) before anything else is touched.
      expect(
        prismaMock.months.updateMany.mock.invocationCallOrder[0],
      ).toBeLessThan(
        prismaMock.bazaar_submissions.updateMany.mock.invocationCallOrder[0],
      );
    });

    it('does nothing to bazaar when none is pending', async () => {
      stubClose();
      await service.createMonth(MESS, MANAGER, 'November 2026');
      expect(prismaMock.bazaar_submissions.updateMany).not.toHaveBeenCalled();
    });

    it('a second close of the same month fails before touching anything', async () => {
      stubClose({ pendingBazaar: [{ id: 'b1' }] });
      prismaMock.months.updateMany.mockResolvedValue({ count: 0 });

      await rejectsWith(
        service.createMonth(MESS, MANAGER, 'November 2026'),
        ConflictException,
        ErrorCode.MONTH_ALREADY_CLOSED,
      );
      expect(prismaMock.bazaar_submissions.updateMany).not.toHaveBeenCalled();
      expect(
        prismaMock.member_month_summaries.createMany,
      ).not.toHaveBeenCalled();
    });

    it('refuses a double submit right after a month was opened', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({ id: 'mgr' });
      prismaMock.months.findFirst.mockResolvedValue(
        monthRow({ started_at: new Date() }),
      );
      await rejectsWith(
        service.createMonth(MESS, MANAGER),
        ConflictException,
        ErrorCode.MONTH_ALREADY_ACTIVE,
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('getMonthSummary totals', () => {
    it('computes meal rate from bazaar only, and due/credit from balances', async () => {
      prismaMock.months.findFirst.mockResolvedValue(
        monthRow({ id: OCT, month_status: 'ARCHIVED' }),
      );
      const member = (id: string, name: string, balance: number) => ({
        id: `s-${id}`,
        member_id: id,
        total_meals: 10,
        meal_cost: 0,
        shared_cost: 0,
        individual_cost: 0,
        deposit_amount: 0,
        final_bill: 0,
        final_balance: balance,
        member: {
          removed_at: id === 'b' ? new Date() : null,
          deleted_at: null,
          user: { id, name, email: `${id}@x`, avatar: null },
        },
      });
      prismaMock.member_month_summaries.findMany.mockResolvedValue([
        member('b', 'Bob', -250.5),
        member('a', 'Alice', 400),
      ]);
      prismaMock.meal_entries.aggregate.mockResolvedValue({
        _sum: { total_meal: 40 },
      });
      prismaMock.expenses.groupBy.mockResolvedValue([
        { type: 'BAZAAR', _sum: { amount: 4000 } },
        { type: 'SHARED', _sum: { amount: 1000 } },
      ]);
      prismaMock.deposits.aggregate.mockResolvedValue({
        _sum: { amount: 3000 },
      });
      prismaMock.carry_forward_balances.findMany.mockResolvedValue([
        { member_id: 'a', amount: 100, carry_forward_type: 'PREVIOUS_BALANCE' },
        { member_id: 'b', amount: 50, carry_forward_type: 'PREVIOUS_DUE' },
      ]);
      prismaMock.activity_logs.findFirst.mockResolvedValue({
        actor: { id: MANAGER, name: 'Tanvir' },
      });

      const { totals, member_summaries } = await service.getMonthSummary(
        MESS,
        OCT,
      );

      expect(totals).toEqual({
        member_count: 2,
        total_meals: 40,
        meal_rate: 100,
        bazaar_cost: 4000,
        shared_cost: 1000,
        individual_cost: 0,
        total_expense: 5000,
        total_deposits: 3000,
        carried_in_balance: 100,
        carried_in_due: 50,
        total_due: 250.5,
        total_credit: 400,
        closed_by: { id: MANAGER, name: 'Tanvir' },
      });
      expect(
        member_summaries.map((m) => [m.user.name, m.carried_in, m.removed]),
      ).toEqual([
        ['Alice', 100, false],
        ['Bob', -50, true],
      ]);
    });
  });
});
