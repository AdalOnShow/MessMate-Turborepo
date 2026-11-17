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
import { BazaarService } from './bazaar.service';

const MESS = 'mess-1';
const MONTH = 'month-1';
const MANAGER = 'manager-user';
const SHOPPER = 'shopper-user';
const OTHER = 'other-member';

const submissionRow = (over: Record<string, unknown> = {}) => ({
  id: 'baz-1',
  mess_id: MESS,
  month_id: MONTH,
  submitted_by: SHOPPER,
  status: 'PENDING',
  description: null,
  items: [{ name: 'Rice', amount: 1900 }],
  total_amount: 1900,
  expense_date: new Date('2026-11-10T00:00:00Z'),
  approved_by: null,
  approved_at: null,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  month: { month_status: 'ACTIVE' },
  submitter: { id: SHOPPER, name: 'S', email: 's@x', avatar: null },
  approver: null,
  ...over,
});

describe('BazaarService', () => {
  const service = new BazaarService();

  beforeEach(resetPrismaMock);

  describe('approveBazaar', () => {
    function managerAndSubmission(over: Record<string, unknown> = {}) {
      prismaMock.mess_members.findFirst.mockResolvedValue({ id: 'mgr' });
      prismaMock.bazaar_submissions.findFirst.mockResolvedValue(
        submissionRow(over),
      );
    }

    it('is manager-only', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.approveBazaar(MESS, 'baz-1', SHOPPER),
        ForbiddenException,
        ErrorCode.MANAGER_ONLY,
      );
      expect(prismaMock.expenses.create).not.toHaveBeenCalled();
    });

    it('cannot approve into a closed month', async () => {
      managerAndSubmission({ month: { month_status: 'ARCHIVED' } });
      await rejectsWith(
        service.approveBazaar(MESS, 'baz-1', MANAGER),
        ConflictException,
        ErrorCode.MONTH_ALREADY_CLOSED,
      );
      expect(prismaMock.expenses.create).not.toHaveBeenCalled();
    });

    it('cannot approve twice', async () => {
      managerAndSubmission({ status: 'APPROVED' });
      await rejectsWith(
        service.approveBazaar(MESS, 'baz-1', MANAGER),
        BadRequestException,
      );
      expect(prismaMock.expenses.create).not.toHaveBeenCalled();
    });

    it('a concurrent second approval loses the claim and creates no expense', async () => {
      // Both requests saw PENDING; the other one claimed it first.
      managerAndSubmission();
      prismaMock.bazaar_submissions.updateMany.mockResolvedValue({ count: 0 });

      await rejectsWith(
        service.approveBazaar(MESS, 'baz-1', MANAGER),
        ConflictException,
      );
      expect(prismaMock.expenses.create).not.toHaveBeenCalled();
    });

    it('claims only a pending submission of an active month, then creates one BAZAAR expense', async () => {
      managerAndSubmission();
      prismaMock.bazaar_submissions.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.bazaar_submissions.findUniqueOrThrow.mockResolvedValue(
        submissionRow({ status: 'APPROVED', total_amount: 2100 }),
      );

      const result = await service.approveBazaar(MESS, 'baz-1', MANAGER);

      expect(result.status).toBe('APPROVED');
      expect(prismaMock.bazaar_submissions.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'baz-1',
          mess_id: MESS,
          status: 'PENDING',
          deleted_at: null,
          month: { month_status: 'ACTIVE', deleted_at: null },
        },
        data: expect.objectContaining({
          status: 'APPROVED',
          approved_by: MANAGER,
        }),
      });
      expect(prismaMock.expenses.create).toHaveBeenCalledTimes(1);
      // Amount comes from the row read after the claim.
      expect(prismaMock.expenses.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'BAZAAR',
          amount: 2100,
          month_id: MONTH,
        }),
      });
    });
  });

  describe('rejectBazaar', () => {
    it('loses the claim cleanly if it was approved meanwhile', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({ id: 'mgr' });
      prismaMock.bazaar_submissions.findFirst.mockResolvedValue(
        submissionRow(),
      );
      prismaMock.bazaar_submissions.updateMany.mockResolvedValue({ count: 0 });
      await rejectsWith(
        service.rejectBazaar(MESS, 'baz-1', MANAGER),
        ConflictException,
      );
      expect(prismaMock.activity_logs.create).not.toHaveBeenCalled();
    });
  });

  describe('updateBazaar / deleteBazaar', () => {
    it('another plain member cannot edit it', async () => {
      prismaMock.bazaar_submissions.findFirst.mockResolvedValue(
        submissionRow(),
      );
      prismaMock.mess_members.findFirst.mockResolvedValue({
        mess_role: 'MEMBER',
      });
      await rejectsWith(
        service.updateBazaar(MESS, 'baz-1', OTHER, { description: 'x' }),
        ForbiddenException,
      );
      expect(prismaMock.bazaar_submissions.updateMany).not.toHaveBeenCalled();
    });

    it('cannot be edited once its month is closed', async () => {
      prismaMock.bazaar_submissions.findFirst.mockResolvedValue(
        submissionRow({ month: { month_status: 'ARCHIVED' } }),
      );
      await rejectsWith(
        service.updateBazaar(MESS, 'baz-1', SHOPPER, { description: 'x' }),
        ConflictException,
        ErrorCode.MONTH_ALREADY_CLOSED,
      );
    });

    it('an edit that races an approval fails instead of changing an approved amount', async () => {
      prismaMock.bazaar_submissions.findFirst.mockResolvedValue(
        submissionRow(),
      );
      prismaMock.mess_members.findFirst.mockResolvedValue({
        mess_role: 'MEMBER',
      });
      prismaMock.bazaar_submissions.updateMany.mockResolvedValue({ count: 0 });
      await rejectsWith(
        service.updateBazaar(MESS, 'baz-1', SHOPPER, {
          items: [{ name: 'Rice', amount: 9999 }],
        }),
        ConflictException,
      );
    });

    it('the submitter can delete it; the delete is logged in the same transaction', async () => {
      prismaMock.bazaar_submissions.findFirst.mockResolvedValue(
        submissionRow(),
      );
      prismaMock.mess_members.findFirst.mockResolvedValue({
        mess_role: 'MEMBER',
      });
      prismaMock.bazaar_submissions.updateMany.mockResolvedValue({ count: 1 });

      await service.deleteBazaar(MESS, 'baz-1', SHOPPER);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.bazaar_submissions.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { deleted_at: expect.any(Date) } }),
      );
      expect(prismaMock.activity_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'BAZAAR_DELETED',
          entity_id: 'baz-1',
        }),
      });
    });
  });
});
