jest.mock(
  '@repo/database',
  () => jest.requireActual('../../test/prisma-mock').databaseModule,
);

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ErrorCode } from '@repo/shared';
import { prismaMock, resetPrismaMock } from '../../test/prisma-mock';
import { rejectsWith } from '../../test/helpers';
import { ExpensesService } from './expenses.service';

const MESS = 'mess-1';
const MONTH = 'month-1';
const MANAGER = 'manager-user';

const expenseRow = (over: Record<string, unknown> = {}) => ({
  id: 'exp-1',
  mess_id: MESS,
  month_id: MONTH,
  type: 'SHARED',
  title: 'Internet',
  amount: 1200,
  created_by: MANAGER,
  expense_date: new Date('2026-11-07T00:00:00Z'),
  created_at: new Date(),
  updated_at: new Date(),
  month: { month_status: 'ACTIVE' },
  creator: { id: MANAGER, name: 'M', email: 'm@x', avatar: null },
  members: [],
  ...over,
});

describe('ExpensesService', () => {
  const service = new ExpensesService();

  beforeEach(resetPrismaMock);

  const asManager = () =>
    prismaMock.mess_members.findFirst.mockResolvedValueOnce({ id: 'mgr' });

  describe('createExpense', () => {
    it('is manager-only', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.createExpense(MESS, MONTH, 'member-user', {
          type: 'SHARED',
          title: 'x',
          amount: 10,
          expense_date: '2026-11-07T00:00:00.000Z',
          member_ids: ['a'],
        }),
        ForbiddenException,
        ErrorCode.MANAGER_ONLY,
      );
    });

    it('rejects members who are not active in this mess', async () => {
      asManager();
      prismaMock.months.findFirst.mockResolvedValue({ id: MONTH });
      prismaMock.mess_members.findMany.mockResolvedValue([{ id: 'a' }]);
      await rejectsWith(
        service.createExpense(MESS, MONTH, MANAGER, {
          type: 'SHARED',
          title: 'x',
          amount: 10,
          expense_date: '2026-11-07T00:00:00.000Z',
          member_ids: ['a', 'from-another-mess'],
        }),
        BadRequestException,
      );
      expect(prismaMock.expenses.create).not.toHaveBeenCalled();
    });

    it('splits a shared expense so the parts add up exactly', async () => {
      asManager();
      prismaMock.months.findFirst.mockResolvedValue({ id: MONTH });
      prismaMock.mess_members.findMany.mockResolvedValue([
        { id: 'a' },
        { id: 'b' },
        { id: 'c' },
      ]);
      prismaMock.expenses.create.mockResolvedValue(expenseRow());

      await service.createExpense(MESS, MONTH, MANAGER, {
        type: 'SHARED',
        title: 'Gas',
        amount: 100,
        expense_date: '2026-11-07T00:00:00.000Z',
        member_ids: ['a', 'b', 'c'],
      });

      const { data } = prismaMock.expenses.create.mock.calls[0][0];
      const parts = (data.members.create as { allocated_amount: number }[]).map(
        (m) => m.allocated_amount,
      );
      expect(parts).toEqual([33.33, 33.33, 33.34]);
      expect(Math.round(parts.reduce((a, b) => a + b, 0) * 100)).toBe(10000);
    });
  });

  describe('updateExpense / deleteExpense', () => {
    it('cannot change an expense in a closed month', async () => {
      asManager();
      prismaMock.expenses.findFirst.mockResolvedValue(
        expenseRow({ month: { month_status: 'ARCHIVED' } }),
      );
      await rejectsWith(
        service.updateExpense(MESS, 'exp-1', MANAGER, { amount: 1 }),
        ConflictException,
        ErrorCode.MONTH_ALREADY_CLOSED,
      );
      expect(prismaMock.expenses.update).not.toHaveBeenCalled();
    });

    it('cannot delete an expense in a closed month', async () => {
      asManager();
      prismaMock.expenses.findFirst.mockResolvedValue(
        expenseRow({ month: { month_status: 'ARCHIVED' } }),
      );
      await rejectsWith(
        service.deleteExpense(MESS, 'exp-1', MANAGER),
        ConflictException,
        ErrorCode.MONTH_ALREADY_CLOSED,
      );
      expect(prismaMock.expenses.delete).not.toHaveBeenCalled();
    });

    it('keeps bazaar expenses locked', async () => {
      asManager();
      prismaMock.expenses.findFirst.mockResolvedValue(
        expenseRow({ type: 'BAZAAR' }),
      );
      await rejectsWith(
        service.deleteExpense(MESS, 'exp-1', MANAGER),
        ForbiddenException,
        ErrorCode.EXPENSE_LOCKED,
      );
    });

    it('deletes allocations, the expense and logs, in one transaction', async () => {
      asManager();
      prismaMock.expenses.findFirst.mockResolvedValue(expenseRow());

      await service.deleteExpense(MESS, 'exp-1', MANAGER);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.expense_members.deleteMany).toHaveBeenCalledWith({
        where: { expense_id: 'exp-1' },
      });
      expect(prismaMock.activity_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'EXPENSE_DELETED' }),
      });
    });
  });
});
