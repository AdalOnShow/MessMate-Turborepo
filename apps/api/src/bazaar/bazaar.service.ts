import { ErrorCode } from '@repo/shared';
import {
  BadRequestException,
  ConflictException,
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
      throw new BadRequestException({
        message: 'Total bazaar amount must be greater than zero',
        code: ErrorCode.BAZAAR_TOTAL_ZERO,
      });
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

  /**
   * Loads a submission of this mess that can still change: PENDING and in
   * an ACTIVE month. A closed month is already billed, and its leftover
   * pending submissions are rejected when it closes.
   */
  private async findOpenSubmission(
    messId: string,
    submissionId: string,
    verb: string,
  ) {
    const submission = await prisma.bazaar_submissions.findFirst({
      where: { id: submissionId, mess_id: messId, deleted_at: null },
      include: { month: { select: { month_status: true } } },
    });

    if (!submission) {
      throw new NotFoundException({
        message: 'Bazaar submission not found',
        code: ErrorCode.BAZAAR_NOT_FOUND,
      });
    }

    if (submission.month.month_status !== 'ACTIVE') {
      throw new ConflictException({
        message: 'This month is closed. Its bazaar can no longer be changed.',
        code: ErrorCode.MONTH_ALREADY_CLOSED,
      });
    }

    if (submission.status !== 'PENDING') {
      throw new ConflictException({
        message: `Only pending submissions can be ${verb}`,
        code: ErrorCode.BAZAAR_NOT_PENDING,
      });
    }

    return submission;
  }

  /**
   * Atomically moves a submission out of PENDING (or just re-checks it is
   * still pending and open, when `data` keeps the status). Two managers
   * approving at the same moment used to both succeed and create two
   * BAZAAR expenses; now the second one matches nothing and gets a 409.
   */
  private async claimPending(
    tx: Prisma.TransactionClient,
    messId: string,
    submissionId: string,
    data: Prisma.bazaar_submissionsUncheckedUpdateManyInput,
  ) {
    const claimed = await tx.bazaar_submissions.updateMany({
      where: {
        id: submissionId,
        mess_id: messId,
        status: 'PENDING',
        deleted_at: null,
        month: { month_status: 'ACTIVE', deleted_at: null },
      },
      data,
    });

    if (claimed.count === 0) {
      throw new ConflictException({
        message:
          'This submission was just changed by someone else. Refresh and try again.',
        code: ErrorCode.BAZAAR_CHANGED,
      });
    }
  }

  private async requireMember(messId: string, actorId: string, action: string) {
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
        message: `You must be an active member to ${action} a bazaar`,
        code: ErrorCode.NOT_MESS_MEMBER,
      });
    }

    return membership;
  }

  private async requireManager(
    messId: string,
    actorId: string,
    action: string,
  ) {
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
        message: `Only managers can ${action} bazaar submissions`,
        code: ErrorCode.MANAGER_ONLY,
      });
    }
  }

  async updateBazaar(
    messId: string,
    submissionId: string,
    actorId: string,
    data: UpdateBazaarDto,
  ): Promise<BazaarSubmissionWithRelations> {
    const submission = await this.findOpenSubmission(
      messId,
      submissionId,
      'edited',
    );
    const membership = await this.requireMember(messId, actorId, 'edit');

    const isSubmitter = submission.submitted_by === actorId;
    const isManager = membership.mess_role === 'MANAGER';

    if (!isSubmitter && !isManager) {
      throw new ForbiddenException({
        message: 'Only the submitter or a manager can edit this submission',
        code: ErrorCode.BAZAAR_NOT_OWNER,
      });
    }

    const items = data.items ?? (submission.items as unknown as BazaarItem[]);
    const totalAmount = this.computeTotalAmount(items);

    if (totalAmount <= 0) {
      throw new BadRequestException({
        message: 'Total bazaar amount must be greater than zero',
        code: ErrorCode.BAZAAR_TOTAL_ZERO,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Fails if it was approved/rejected meanwhile, so an approved amount
      // can never be edited after its expense was created.
      await this.claimPending(tx, messId, submissionId, {
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

      return tx.bazaar_submissions.findUniqueOrThrow({
        where: { id: submissionId },
        include: submissionInclude,
      });
    });

    this.logger.log(`✅ Bazaar updated: ${submissionId}`);
    return toSubmissionWithRelations(updated);
  }

  async deleteBazaar(
    messId: string,
    submissionId: string,
    actorId: string,
  ): Promise<{ success: true }> {
    const submission = await this.findOpenSubmission(
      messId,
      submissionId,
      'deleted',
    );
    const membership = await this.requireMember(messId, actorId, 'delete');

    const isSubmitter = submission.submitted_by === actorId;
    const isManager = membership.mess_role === 'MANAGER';

    if (!isSubmitter && !isManager) {
      throw new ForbiddenException({
        message: 'Only the submitter or a manager can delete this submission',
        code: ErrorCode.BAZAAR_NOT_OWNER,
      });
    }

    await prisma.$transaction(async (tx) => {
      await this.claimPending(tx, messId, submissionId, {
        deleted_at: new Date(),
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: submission.month_id,
          actor_id: actorId,
          action: 'BAZAAR_DELETED',
          entity_type: 'bazaar_submissions',
          entity_id: submissionId,
        },
      });
    });

    this.logger.log(`✅ Bazaar deleted: ${submissionId}`);
    return { success: true };
  }

  async approveBazaar(
    messId: string,
    submissionId: string,
    actorId: string,
  ): Promise<BazaarSubmissionWithRelations> {
    await this.requireManager(messId, actorId, 'approve');
    const submission = await this.findOpenSubmission(
      messId,
      submissionId,
      'approved',
    );

    const approved = await prisma.$transaction(async (tx) => {
      const now = new Date();
      await this.claimPending(tx, messId, submissionId, {
        status: 'APPROVED',
        approved_by: actorId,
        approved_at: now,
        updated_at: now,
      });

      const updated = await tx.bazaar_submissions.findUniqueOrThrow({
        where: { id: submissionId },
        include: submissionInclude,
      });

      await tx.expenses.create({
        data: {
          mess_id: messId,
          month_id: updated.month_id,
          type: 'BAZAAR',
          title: `Bazaar - ${updated.expense_date.toISOString().split('T')[0]}`,
          // Read after the claim, so a concurrent edit can't leave the
          // expense with a stale amount.
          amount: updated.total_amount,
          created_by: actorId,
          expense_date: updated.expense_date,
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
    await this.requireManager(messId, actorId, 'reject');
    const submission = await this.findOpenSubmission(
      messId,
      submissionId,
      'rejected',
    );

    const rejected = await prisma.$transaction(async (tx) => {
      const now = new Date();
      await this.claimPending(tx, messId, submissionId, {
        status: 'REJECTED',
        approved_by: actorId,
        approved_at: now,
        updated_at: now,
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

      return tx.bazaar_submissions.findUniqueOrThrow({
        where: { id: submissionId },
        include: submissionInclude,
      });
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
