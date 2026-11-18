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
import { DepositsService } from './deposits.service';

const MESS = 'mess-1';
const MONTH = 'month-1';
const MANAGER = 'manager-user';

const depositRow = (over: Record<string, unknown> = {}) => ({
  id: 'dep-1',
  mess_id: MESS,
  month_id: MONTH,
  member_id: 'member-1',
  amount: 500,
  deposit_date: new Date('2026-11-10T00:00:00Z'),
  created_by: MANAGER,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  month: { month_status: 'ACTIVE' },
  member: { id: 'member-1', user: { name: 'A', email: 'a@x', avatar: null } },
  creator: { id: MANAGER, name: 'M', email: 'm@x', avatar: null },
  ...over,
});

describe('DepositsService', () => {
  const service = new DepositsService();

  beforeEach(resetPrismaMock);

  const asManager = () =>
    prismaMock.mess_members.findFirst.mockResolvedValueOnce({ id: 'mgr' });

  describe('createDeposit', () => {
    const input = {
      member_id: 'member-1',
      amount: 500,
      deposit_date: '2026-11-10T00:00:00.000Z',
    };

    it('is manager-only', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.createDeposit(MESS, MONTH, 'member-user', input),
        ForbiddenException,
        ErrorCode.MANAGER_ONLY,
      );
      expect(prismaMock.deposits.create).not.toHaveBeenCalled();
    });

    it('only goes into an active month of this mess', async () => {
      asManager();
      prismaMock.months.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.createDeposit(MESS, MONTH, MANAGER, input),
        NotFoundException,
        ErrorCode.NO_ACTIVE_MONTH,
      );
      expect(prismaMock.months.findFirst).toHaveBeenCalledWith({
        where: {
          id: MONTH,
          mess_id: MESS,
          month_status: 'ACTIVE',
          deleted_at: null,
        },
      });
    });

    it('rejects a member who is not active in this mess', async () => {
      asManager();
      prismaMock.months.findFirst.mockResolvedValue({
        id: MONTH,
        mess_id: MESS,
        started_at: new Date('2026-11-01T00:00:00Z'),
      });
      prismaMock.mess_members.findFirst.mockResolvedValueOnce(null);
      await rejectsWith(
        service.createDeposit(MESS, MONTH, MANAGER, input),
        BadRequestException,
      );
      expect(prismaMock.deposits.create).not.toHaveBeenCalled();
    });
  });

  describe('updateDeposit / deleteDeposit', () => {
    it('cannot change a deposit in a closed month', async () => {
      asManager();
      prismaMock.deposits.findFirst.mockResolvedValue(
        depositRow({ month: { month_status: 'ARCHIVED' } }),
      );
      await rejectsWith(
        service.updateDeposit(MESS, 'dep-1', MANAGER, { amount: 1 }),
        ConflictException,
        ErrorCode.MONTH_ALREADY_CLOSED,
      );
      expect(prismaMock.deposits.update).not.toHaveBeenCalled();
    });

    it('cannot delete a deposit in a closed month', async () => {
      asManager();
      prismaMock.deposits.findFirst.mockResolvedValue(
        depositRow({ month: { month_status: 'ARCHIVED' } }),
      );
      await rejectsWith(
        service.deleteDeposit(MESS, 'dep-1', MANAGER),
        ConflictException,
        ErrorCode.MONTH_ALREADY_CLOSED,
      );
      expect(prismaMock.deposits.update).not.toHaveBeenCalled();
    });

    it('only finds deposits of this mess', async () => {
      asManager();
      prismaMock.deposits.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.deleteDeposit(MESS, 'dep-1', MANAGER),
        NotFoundException,
      );
      expect(prismaMock.deposits.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'dep-1', mess_id: MESS, deleted_at: null },
        }),
      );
    });

    it('soft-deletes and logs in one transaction', async () => {
      asManager();
      prismaMock.deposits.findFirst.mockResolvedValue(depositRow());

      await service.deleteDeposit(MESS, 'dep-1', MANAGER);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.deposits.update).toHaveBeenCalledWith({
        where: { id: 'dep-1' },
        data: { deleted_at: expect.any(Date) },
      });
      expect(prismaMock.activity_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'DEPOSIT_DELETED' }),
      });
    });

    it('updates a deposit in an active month', async () => {
      asManager();
      prismaMock.deposits.findFirst.mockResolvedValue(depositRow());
      prismaMock.deposits.update.mockResolvedValue(depositRow({ amount: 800 }));

      const result = await service.updateDeposit(MESS, 'dep-1', MANAGER, {
        amount: 800,
      });

      expect(result.amount).toBe(800);
      expect(prismaMock.activity_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'DEPOSIT_UPDATED' }),
      });
    });
  });

  describe('getDepositHistory (Reports "Load more")', () => {
    beforeEach(() => {
      prismaMock.months.findFirst.mockResolvedValue({
        id: MONTH,
        mess_id: MESS,
        started_at: new Date('2026-11-01T00:00:00Z'),
      });
      prismaMock.deposits.groupBy.mockResolvedValue([
        { member_id: 'member-1', _count: { _all: 3 }, _sum: { amount: 1500 } },
        { member_id: 'member-2', _count: { _all: 2 }, _sum: { amount: 700 } },
      ]);
      prismaMock.mess_members.findMany.mockResolvedValue([
        { id: 'member-1', user: { name: 'Rahim' } },
        { id: 'member-2', user: { name: 'Karim' } },
      ]);
    });

    it('fetches one extra row to know if there is a next page', async () => {
      prismaMock.deposits.findMany.mockResolvedValue([
        depositRow({ id: '11111111-1111-4111-8111-111111111111' }),
        depositRow({ id: '22222222-2222-4222-8222-222222222222' }),
        depositRow({ id: '33333333-3333-4333-8333-333333333333' }),
      ]);

      const page = await service.getDepositHistory(MESS, MONTH, { limit: 2 });

      expect(prismaMock.deposits.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 3 }),
      );
      expect(page.items).toHaveLength(2);
      expect(page.next_cursor).toEqual(expect.any(String));
      expect(page.total).toBe(5);
      expect(page.total_amount).toBe(2200);
      expect(page.member_counts.map((m) => [m.name, m.count])).toEqual([
        ['Karim', 2],
        ['Rahim', 3],
      ]);
    });

    it('filters by member on the server, and the totals follow the filter', async () => {
      prismaMock.deposits.findMany.mockResolvedValue([depositRow()]);

      const page = await service.getDepositHistory(MESS, MONTH, {
        limit: 8,
        memberId: 'member-2',
      });

      expect(prismaMock.deposits.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ member_id: 'member-2' }),
        }),
      );
      expect(page.next_cursor).toBeNull();
      expect(page.total).toBe(2);
      expect(page.total_amount).toBe(700);
      // Chip counts stay for everyone, whatever the filter.
      expect(page.all_count).toBe(5);
    });
  });
});
