import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@repo/database';
import type {
  BazaarItem,
  BazaarSubmissionWithRelations,
  BazaarHistory,
  CreateBazaarDto,
  UpdateBazaarDto,
} from '@repo/shared';

const submitterSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} as const;

const submissionInclude = {
  submitter: { select: submitterSelect },
  approver: { select: submitterSelect },
} satisfies Prisma.bazaar_submissionsInclude;

type SubmissionWithRelations = Prisma.bazaar_submissionsGetPayload<{
  include: typeof submissionInclude;
}>;

function toSubmissionWithRelations(
  row: SubmissionWithRelations,
): BazaarSubmissionWithRelations {
  return {
    id: row.id,
    mess_id: row.mess_id,
    month_id: row.month_id,
    submitted_by: row.submitted_by,
    status: row.status,
    description: row.description,
    items: row.items as unknown as BazaarItem[],
    total_amount: Number(row.total_amount),
    expense_date: row.expense_date.toISOString(),
    approved_by: row.approved_by,
    approved_at: row.approved_at?.toISOString() ?? null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    submitter: row.submitter,
    approver: row.approver ?? null,
  };
}

@Injectable()
export class BazaarService {
  private readonly logger = new Logger(BazaarService.name);

  private async findActiveMonth(messId: string, monthId?: string) {
    const month = await prisma.months.findFirst({
      where: {
        id: monthId,
        mess_id: messId,
        month_status: 'ACTIVE',
        deleted_at: null,
      },
    });

    if (!month) {
      throw new NotFoundException('Active month not found');
    }

    return month;
  }

  private computeTotalAmount(items: BazaarItem[]): number {
    return items.reduce((sum, item) => sum + item.amount, 0);
  }

  async submitBazaar(
    messId: string,
    monthId: string,
    actorId: string,
    data: CreateBazaarDto,
  ): Promise<BazaarSubmissionWithRelations> {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: actorId,
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be an active member to submit a bazaar',
      );
    }

    const month = await this.findActiveMonth(messId, monthId);
    const totalAmount = this.computeTotalAmount(data.items);

    if (totalAmount <= 0) {
      throw new BadRequestException(
        'Total bazaar amount must be greater than zero',
      );
    }

    const submission = await prisma.$transaction(async (tx) => {
      const created = await tx.bazaar_submissions.create({
        data: {
          mess_id: messId,
          month_id: month.id,
          submitted_by: actorId,
          status: 'PENDING',
          description: data.description || null,
          items: data.items as Prisma.InputJsonValue,
          total_amount: totalAmount,
          expense_date: new Date(data.expense_date),
        },
        include: submissionInclude,
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: month.id,
          actor_id: actorId,
          action: 'BAZAAR_SUBMITTED',
          entity_type: 'bazaar_submissions',
          entity_id: created.id,
        },
      });

      return created;
    });

    this.logger.log(
      `✅ Bazaar submitted: ${submission.id} - total: ${totalAmount}`,
    );
    return toSubmissionWithRelations(submission);
  }

  async updateBazaar(
    messId: string,
    submissionId: string,
    actorId: string,
    data: UpdateBazaarDto,
  ): Promise<BazaarSubmissionWithRelations> {
    const submission = await prisma.bazaar_submissions.findFirst({
      where: { id: submissionId, mess_id: messId, deleted_at: null },
    });

    if (!submission) {
      throw new NotFoundException('Bazaar submission not found');
    }

    if (submission.status !== 'PENDING') {
      throw new BadRequestException('Only pending submissions can be edited');
    }

    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: actorId,
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be an active member to edit a bazaar',
      );
    }

    const isSubmitter = submission.submitted_by === actorId;
    const isManager = membership.mess_role === 'MANAGER';

    if (!isSubmitter && !isManager) {
      throw new ForbiddenException(
        'Only the submitter or a manager can edit this submission',
      );
    }

    const items = data.items ?? (submission.items as unknown as BazaarItem[]);
    const totalAmount = this.computeTotalAmount(items);

    if (totalAmount <= 0) {
      throw new BadRequestException(
        'Total bazaar amount must be greater than zero',
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.bazaar_submissions.update({
        where: { id: submissionId },
        data: {
          items: items as Prisma.InputJsonValue,
          total_amount: totalAmount,
          description:
            data.description !== undefined
              ? data.description || null
              : submission.description,
          expense_date: data.expense_date
            ? new Date(data.expense_date)
            : submission.expense_date,
          updated_at: new Date(),
        },
        include: submissionInclude,
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: submission.month_id,
          actor_id: actorId,
          action: 'BAZAAR_UPDATED',
          entity_type: 'bazaar_submissions',
          entity_id: submissionId,
        },
      });

      return result;
    });

    this.logger.log(`✅ Bazaar updated: ${submissionId}`);
    return toSubmissionWithRelations(updated);
  }

  async deleteBazaar(
    messId: string,
    submissionId: string,
    actorId: string,
  ): Promise<{ success: true }> {
    const submission = await prisma.bazaar_submissions.findFirst({
      where: { id: submissionId, mess_id: messId, deleted_at: null },
    });

    if (!submission) {
      throw new NotFoundException('Bazaar submission not found');
    }

    if (submission.status !== 'PENDING') {
      throw new BadRequestException('Only pending submissions can be deleted');
    }

    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: actorId,
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You must be an active member to delete a bazaar',
      );
    }

    const isSubmitter = submission.submitted_by === actorId;
    const isManager = membership.mess_role === 'MANAGER';

    if (!isSubmitter && !isManager) {
      throw new ForbiddenException(
        'Only the submitter or a manager can delete this submission',
      );
    }

    await prisma.bazaar_submissions.update({
      where: { id: submissionId },
      data: { deleted_at: new Date() },
    });

    this.logger.log(`✅ Bazaar deleted: ${submissionId}`);
    return { success: true };
  }

  async approveBazaar(
    messId: string,
    submissionId: string,
    actorId: string,
  ): Promise<BazaarSubmissionWithRelations> {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: actorId,
        mess_role: 'MANAGER',
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only managers can approve bazaar submissions',
      );
    }

    const submission = await prisma.bazaar_submissions.findFirst({
      where: { id: submissionId, mess_id: messId, deleted_at: null },
    });

    if (!submission) {
      throw new NotFoundException('Bazaar submission not found');
    }

    if (submission.status !== 'PENDING') {
      throw new BadRequestException('Only pending submissions can be approved');
    }

    const approved = await prisma.$transaction(async (tx) => {
      const updated = await tx.bazaar_submissions.update({
        where: { id: submissionId },
        data: {
          status: 'APPROVED',
          approved_by: actorId,
          approved_at: new Date(),
          updated_at: new Date(),
        },
        include: submissionInclude,
      });

      await tx.expenses.create({
        data: {
          mess_id: messId,
          month_id: submission.month_id,
          type: 'BAZAAR',
          title: `Bazaar - ${new Date(submission.expense_date).toISOString().split('T')[0]}`,
          amount: submission.total_amount,
          created_by: actorId,
          expense_date: submission.expense_date,
        },
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: submission.month_id,
          actor_id: actorId,
          action: 'BAZAAR_APPROVED',
          entity_type: 'bazaar_submissions',
          entity_id: submissionId,
        },
      });

      return updated;
    });

    this.logger.log(
      `✅ Bazaar approved: ${submissionId} - expense auto-created`,
    );
    return toSubmissionWithRelations(approved);
  }

  async rejectBazaar(
    messId: string,
    submissionId: string,
    actorId: string,
  ): Promise<BazaarSubmissionWithRelations> {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: actorId,
        mess_role: 'MANAGER',
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'Only managers can reject bazaar submissions',
      );
    }

    const submission = await prisma.bazaar_submissions.findFirst({
      where: { id: submissionId, mess_id: messId, deleted_at: null },
    });

    if (!submission) {
      throw new NotFoundException('Bazaar submission not found');
    }

    if (submission.status !== 'PENDING') {
      throw new BadRequestException('Only pending submissions can be rejected');
    }

    const rejected = await prisma.$transaction(async (tx) => {
      const updated = await tx.bazaar_submissions.update({
        where: { id: submissionId },
        data: {
          status: 'REJECTED',
          approved_by: actorId,
          approved_at: new Date(),
          updated_at: new Date(),
        },
        include: submissionInclude,
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: submission.month_id,
          actor_id: actorId,
          action: 'BAZAAR_REJECTED',
          entity_type: 'bazaar_submissions',
          entity_id: submissionId,
        },
      });

      return updated;
    });

    this.logger.log(`✅ Bazaar rejected: ${submissionId}`);
    return toSubmissionWithRelations(rejected);
  }

  async getBazaarHistory(
    messId: string,
    monthId: string,
  ): Promise<BazaarHistory> {
    const submissions = await prisma.bazaar_submissions.findMany({
      where: {
        mess_id: messId,
        month_id: monthId,
        deleted_at: null,
      },
      include: submissionInclude,
      orderBy: { created_at: 'desc' },
    });

    const mapped = submissions.map(toSubmissionWithRelations);

    return {
      pending: mapped.filter((s) => s.status === 'PENDING'),
      approved: mapped.filter((s) => s.status === 'APPROVED'),
      rejected: mapped.filter((s) => s.status === 'REJECTED'),
    };
  }
}
