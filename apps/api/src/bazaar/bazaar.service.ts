import { ErrorCode } from '@repo/shared';
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
  BazaarStatusCounts,
  BazaarSubmissionPage,
  CreateBazaarDto,
  ListBazaarQueryDto,
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

const CURSOR_SEPARATOR = '_';
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function encodeCursor(row: { created_at: Date; id: string }): string {
  return `${row.created_at.toISOString()}${CURSOR_SEPARATOR}${row.id}`;
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } {
  const at = cursor.lastIndexOf(CURSOR_SEPARATOR);
  const createdAt = new Date(cursor.slice(0, at));
  const id = cursor.slice(at + 1);
  if (at <= 0 || Number.isNaN(createdAt.getTime()) || !uuidPattern.test(id)) {
    throw new BadRequestException({
      message: 'Validation failed',
      details: { cursor: 'Invalid cursor' },
    });
  }
  return { createdAt, id };
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
      throw new NotFoundException({
        message: 'Active month not found',
        code: ErrorCode.NO_ACTIVE_MONTH,
      });
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
      throw new ForbiddenException({
        message: 'You must be an active member to submit a bazaar',
        code: ErrorCode.NOT_MESS_MEMBER,
      });
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
      throw new ForbiddenException({
        message: 'You must be an active member to edit a bazaar',
        code: ErrorCode.NOT_MESS_MEMBER,
      });
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
      throw new ForbiddenException({
        message: 'You must be an active member to delete a bazaar',
        code: ErrorCode.NOT_MESS_MEMBER,
      });
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
      throw new ForbiddenException({
        message: 'Only managers can approve bazaar submissions',
        code: ErrorCode.MANAGER_ONLY,
      });
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
      throw new ForbiddenException({
        message: 'Only managers can reject bazaar submissions',
        code: ErrorCode.MANAGER_ONLY,
      });
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

  /**
   * One page of a month's submissions in a single status, newest first.
   *
   * Keyset pagination on (created_at, id): the cursor is the last row's
   * position, so pages stay correct even when rows before it change status
   * or are deleted between requests. created_at is TIMESTAMP(3), so the
   * millisecond ISO string in the cursor matches it exactly. Status counts
   * (for the tab badges) are only computed for the first page.
   */
  async listBazaarSubmissions(
    messId: string,
    monthId: string,
    query: ListBazaarQueryDto,
  ): Promise<BazaarSubmissionPage> {
    const { status, cursor, limit } = query;
    const after = cursor ? decodeCursor(cursor) : null;

    const monthWhere = {
      mess_id: messId,
      month_id: monthId,
      deleted_at: null,
    } satisfies Prisma.bazaar_submissionsWhereInput;

    const [rows, grouped] = await Promise.all([
      prisma.bazaar_submissions.findMany({
        where: {
          ...monthWhere,
          status,
          ...(after && {
            OR: [
              { created_at: { lt: after.createdAt } },
              { created_at: after.createdAt, id: { lt: after.id } },
            ],
          }),
        },
        include: submissionInclude,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
      after
        ? null
        : prisma.bazaar_submissions.groupBy({
            by: ['status'],
            where: monthWhere,
            _count: { _all: true },
          }),
    ]);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page[page.length - 1];

    let counts: BazaarStatusCounts | null = null;
    if (grouped) {
      const countOf = (s: BazaarSubmissionWithRelations['status']) =>
        grouped.find((g) => g.status === s)?._count._all ?? 0;
      counts = {
        pending: countOf('PENDING'),
        approved: countOf('APPROVED'),
        rejected: countOf('REJECTED'),
      };
    }

    return {
      items: page.map(toSubmissionWithRelations),
      next_cursor: hasMore && last ? encodeCursor(last) : null,
      counts,
    };
  }
}
