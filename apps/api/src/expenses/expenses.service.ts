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
import {
  afterKey,
  decodeKeysetCursor,
  newestFirst,
  toPage,
} from '../common/pagination/keyset';
import type {
  CreateExpenseDto,
  ExpenseHistoryPage,
  ExpenseHistoryQuery,
  ExpenseListResponse,
  ExpenseMemberSummary,
  ExpenseSummaryResponse,
  ExpenseWithRelations,
  UpdateExpenseDto,
} from '@repo/shared';

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} as const;

const memberUserSelect = {
  id: true,
  user: {
    select: {
      name: true,
      email: true,
      avatar: true,
    },
  },
} as const;

const expenseInclude = {
  creator: { select: userSelect },
  members: {
    include: {
      member: { select: memberUserSelect },
    },
  },
} satisfies Prisma.expensesInclude;

type ExpenseRow = Prisma.expensesGetPayload<{
  include: typeof expenseInclude;
}>;

function toExpenseWithRelations(row: ExpenseRow): ExpenseWithRelations {
  return {
    id: row.id,
    mess_id: row.mess_id,
    month_id: row.month_id,
    type: row.type,
    title: row.title,
    amount: Number(row.amount),
    created_by: row.created_by,
    expense_date: row.expense_date.toISOString(),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    creator: {
      id: row.creator.id,
      name: row.creator.name,
      email: row.creator.email,
      avatar: row.creator.avatar,
    },
    members: row.members.map((alloc) => ({
      member_id: alloc.member_id,
      allocated_amount: Number(alloc.allocated_amount),
      member: {
        id: alloc.member.id,
        name: alloc.member.user.name,
        email: alloc.member.user.email,
        avatar: alloc.member.user.avatar,
      },
    })),
  };
}

function computeSharedSplit(amount: number, memberCount: number): number[] {
  if (memberCount <= 0) {
    return [];
  }
  const perMember = Math.round((amount / memberCount) * 100) / 100;
  const allocations = new Array<number>(memberCount).fill(perMember);
  const total = allocations.reduce((sum, v) => sum + v, 0);
  const diff = Math.round((amount - total) * 100) / 100;
  if (Math.round(diff * 100) !== 0) {
    allocations[memberCount - 1] = Math.round((perMember + diff) * 100) / 100;
  }
  return allocations;
}

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  private async requireManager(messId: string, actorId: string) {
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
        message: 'Only managers can manage expenses',
        code: ErrorCode.MANAGER_ONLY,
      });
    }
  }

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

  private async resolveMembers(messId: string, memberIds: string[]) {
    const uniqueIds = [...new Set(memberIds)];

    const members = await prisma.mess_members.findMany({
      where: {
        id: { in: uniqueIds },
        mess_id: messId,
        removed_at: null,
        deleted_at: null,
      },
    });

    if (members.length !== uniqueIds.length) {
      throw new BadRequestException({
        message:
          'One or more selected members are not active members of this mess',
        code: ErrorCode.MEMBER_NOT_ACTIVE,
      });
    }

    return members;
  }

  private buildAllocations(
    type: string,
    amount: number,
    memberIds: string[],
  ): { member_id: string; allocated_amount: number }[] {
    if (type === 'INDIVIDUAL') {
      return [{ member_id: memberIds[0]!, allocated_amount: amount }];
    }

    const split = computeSharedSplit(amount, memberIds.length);
    return memberIds.map((id, index) => ({
      member_id: id,
      allocated_amount: split[index]!,
    }));
  }

  async createExpense(
    messId: string,
    monthId: string,
    actorId: string,
    data: CreateExpenseDto,
  ): Promise<ExpenseWithRelations> {
    await this.requireManager(messId, actorId);
    const month = await this.findActiveMonth(messId, monthId);
    const members = await this.resolveMembers(messId, data.member_ids);
    const allocations = this.buildAllocations(
      data.type,
      data.amount,
      members.map((m) => m.id),
    );

    const created = await prisma.$transaction(async (tx) => {
      const expense = await tx.expenses.create({
        data: {
          mess_id: messId,
          month_id: month.id,
          type: data.type,
          title: data.title,
          amount: data.amount,
          created_by: actorId,
          expense_date: new Date(data.expense_date),
          members: {
            create: allocations.map((alloc) => ({
              member_id: alloc.member_id,
              allocated_amount: alloc.allocated_amount,
            })),
          },
        },
        include: expenseInclude,
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: month.id,
          actor_id: actorId,
          action: 'EXPENSE_ADDED',
          entity_type: 'expenses',
          entity_id: expense.id,
        },
      });

      return expense;
    });

    this.logger.log(
      `✅ Expense created: ${created.id} - ${created.type} - ${Number(created.amount)}`,
    );
    return toExpenseWithRelations(created);
  }

  async listExpenses(
    messId: string,
    monthId: string,
    actorId: string,
  ): Promise<ExpenseListResponse> {
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
        message: 'You must be an active member to view expenses',
        code: ErrorCode.NOT_MESS_MEMBER,
      });
    }

    await this.findActiveMonth(messId, monthId);

    const rows = await prisma.expenses.findMany({
      where: { mess_id: messId, month_id: monthId },
      include: expenseInclude,
      orderBy: { expense_date: 'desc' },
    });

    const items = rows.map(toExpenseWithRelations);

    const summary = items.reduce(
      (acc, row) => {
        acc.total = Math.round((acc.total + row.amount) * 100) / 100;
        if (row.type === 'SHARED') {
          acc.shared_total =
            Math.round((acc.shared_total + row.amount) * 100) / 100;
        } else if (row.type === 'INDIVIDUAL') {
          acc.individual_total =
            Math.round((acc.individual_total + row.amount) * 100) / 100;
        } else {
          acc.bazaar_total =
            Math.round((acc.bazaar_total + row.amount) * 100) / 100;
        }
        acc.count += 1;
        return acc;
      },
      {
        total: 0,
        shared_total: 0,
        individual_total: 0,
        bazaar_total: 0,
        count: 0,
      },
    );

    return { items, summary };
  }

  /**
   * One "Load more" page of the month's expenses for Reports, newest first,
   * optionally of one type. Membership is checked by MembershipGuard.
   */
  async getExpenseHistory(
    messId: string,
    monthId: string,
    query: ExpenseHistoryQuery,
  ): Promise<ExpenseHistoryPage> {
    await this.findActiveMonth(messId, monthId);

    const base = { mess_id: messId, month_id: monthId };
    const filtered = query.type ? { ...base, type: query.type } : base;
    const after = query.cursor ? decodeKeysetCursor(query.cursor) : null;

    const [rows, byType] = await Promise.all([
      prisma.expenses.findMany({
        where: after
          ? { AND: [filtered, afterKey('expense_date', after)] }
          : filtered,
        include: expenseInclude,
        orderBy: newestFirst('expense_date'),
        take: query.limit + 1,
      }),
      prisma.expenses.groupBy({
        by: ['type'],
        where: base,
        _count: { _all: true },
      }),
    ]);

    const type_counts = { ALL: 0, SHARED: 0, INDIVIDUAL: 0, BAZAAR: 0 };
    for (const g of byType) {
      type_counts[g.type] = g._count._all;
      type_counts.ALL += g._count._all;
    }

    const page = toPage(rows, query.limit, (r) => ({
      date: r.expense_date,
      createdAt: r.created_at,
      id: r.id,
    }));

    return {
      items: page.rows.map(toExpenseWithRelations),
      next_cursor: page.nextCursor,
      total: query.type ? type_counts[query.type] : type_counts.ALL,
      type_counts,
    };
  }

  async getExpenseSummary(
    messId: string,
    monthId: string,
    actorId: string,
  ): Promise<ExpenseSummaryResponse> {
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
        message: 'You must be an active member to view expense reports',
        code: ErrorCode.NOT_MESS_MEMBER,
      });
    }

    await this.findActiveMonth(messId, monthId);

    const rows = await prisma.expenses.findMany({
      where: { mess_id: messId, month_id: monthId },
      include: expenseInclude,
      orderBy: { expense_date: 'desc' },
    });

    const round = (n: number) => Math.round(n * 100) / 100;

    let total = 0;
    let shared_total = 0;
    let individual_total = 0;
    let bazaar_total = 0;

    const memberMap = new Map<string, ExpenseMemberSummary>();

    for (const row of rows) {
      const amount = Number(row.amount);
      total = round(total + amount);

      if (row.type === 'SHARED') {
        shared_total = round(shared_total + amount);
        for (const alloc of row.members) {
          const current =
            memberMap.get(alloc.member_id) ??
            this.emptyMemberSummary(
              alloc.member.id,
              this.memberUser(alloc.member),
            );
          current.shared_cost = round(
            current.shared_cost + Number(alloc.allocated_amount),
          );
          current.total_cost = round(
            current.shared_cost + current.individual_cost,
          );
          memberMap.set(alloc.member_id, current);
        }
      } else if (row.type === 'INDIVIDUAL') {
        individual_total = round(individual_total + amount);
        const target = row.members[0];
        if (target) {
          const current =
            memberMap.get(target.member_id) ??
            this.emptyMemberSummary(
              target.member.id,
              this.memberUser(target.member),
            );
          current.individual_cost = round(current.individual_cost + amount);
          current.total_cost = round(
            current.shared_cost + current.individual_cost,
          );
          memberMap.set(target.member_id, current);
        }
      } else {
        bazaar_total = round(bazaar_total + amount);
      }
    }

    return {
      total,
      shared_total,
      individual_total,
      bazaar_total,
      count: rows.length,
      per_member: Array.from(memberMap.values()).sort((a, b) =>
        a.user.name.localeCompare(b.user.name),
      ),
    };
  }

  private memberUser(member: {
    id: string;
    user: { name: string; email: string; avatar: string | null };
  }): ExpenseMemberSummary['user'] {
    return {
      id: member.id,
      name: member.user.name,
      email: member.user.email,
      avatar: member.user.avatar,
    };
  }

  private emptyMemberSummary(
    memberId: string,
    user: ExpenseMemberSummary['user'],
  ): ExpenseMemberSummary {
    return {
      member_id: memberId,
      user,
      shared_cost: 0,
      individual_cost: 0,
      total_cost: 0,
    };
  }

  async updateExpense(
    messId: string,
    expenseId: string,
    actorId: string,
    data: UpdateExpenseDto,
  ): Promise<ExpenseWithRelations> {
    await this.requireManager(messId, actorId);

    const expense = await prisma.expenses.findFirst({
      where: { id: expenseId, mess_id: messId },
      include: { month: { select: { month_status: true } } },
    });

    if (!expense) {
      throw new NotFoundException({
        message: 'Expense not found',
        code: ErrorCode.EXPENSE_NOT_FOUND,
      });
    }

    // A closed month is already billed (member summaries, carry forward);
    // changing it would make those numbers wrong.
    if (expense.month.month_status !== 'ACTIVE') {
      throw new ConflictException({
        message: 'This month is closed. Its expenses can no longer be changed.',
        code: ErrorCode.MONTH_ALREADY_CLOSED,
      });
    }

    if (expense.type === 'BAZAAR') {
      throw new ForbiddenException({
        message: 'Bazaar expenses are locked and cannot be edited',
        code: ErrorCode.EXPENSE_LOCKED,
      });
    }

    const type = data.type ?? expense.type;
    const amount = data.amount ?? Number(expense.amount);

    const effectiveMemberIds =
      data.member_ids ??
      (
        await prisma.expense_members.findMany({
          where: { expense_id: expenseId },
          select: { member_id: true },
        })
      ).map((a) => a.member_id);

    if (effectiveMemberIds.length === 0) {
      throw new BadRequestException({
        message: 'Expense must have at least one allocated member',
        code: ErrorCode.EXPENSE_MEMBERS_REQUIRED,
      });
    }

    if (type === 'INDIVIDUAL' && effectiveMemberIds.length !== 1) {
      throw new BadRequestException({
        message: 'Individual expenses must be assigned to exactly one member',
        code: ErrorCode.INDIVIDUAL_EXPENSE_ONE_MEMBER,
      });
    }

    const members = await this.resolveMembers(messId, effectiveMemberIds);
    const allocations = this.buildAllocations(
      type,
      amount,
      members.map((m) => m.id),
    );

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.expenses.update({
        where: { id: expenseId },
        data: {
          type,
          title: data.title ?? expense.title,
          amount,
          expense_date: data.expense_date
            ? new Date(data.expense_date)
            : expense.expense_date,
          updated_at: new Date(),
        },
        include: expenseInclude,
      });

      await tx.expense_members.deleteMany({
        where: { expense_id: expenseId },
      });
      await tx.expense_members.createMany({
        data: allocations.map((alloc) => ({
          expense_id: expenseId,
          member_id: alloc.member_id,
          allocated_amount: alloc.allocated_amount,
        })),
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: expense.month_id,
          actor_id: actorId,
          action: 'EXPENSE_UPDATED',
          entity_type: 'expenses',
          entity_id: expenseId,
        },
      });

      return result;
    });

    this.logger.log(`✏️ Expense updated: ${expenseId}`);
    return toExpenseWithRelations(updated);
  }

  async deleteExpense(
    messId: string,
    expenseId: string,
    actorId: string,
  ): Promise<{ id: string }> {
    await this.requireManager(messId, actorId);

    const expense = await prisma.expenses.findFirst({
      where: { id: expenseId, mess_id: messId },
      include: { month: { select: { month_status: true } } },
    });

    if (!expense) {
      throw new NotFoundException({
        message: 'Expense not found',
        code: ErrorCode.EXPENSE_NOT_FOUND,
      });
    }

    // A closed month is already billed (member summaries, carry forward);
    // changing it would make those numbers wrong.
    if (expense.month.month_status !== 'ACTIVE') {
      throw new ConflictException({
        message: 'This month is closed. Its expenses can no longer be changed.',
        code: ErrorCode.MONTH_ALREADY_CLOSED,
      });
    }

    if (expense.type === 'BAZAAR') {
      throw new ForbiddenException({
        message: 'Bazaar expenses are locked and cannot be deleted',
        code: ErrorCode.EXPENSE_LOCKED,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.expense_members.deleteMany({
        where: { expense_id: expenseId },
      });
      await tx.expenses.delete({
        where: { id: expenseId },
      });
      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: expense.month_id,
          actor_id: actorId,
          action: 'EXPENSE_DELETED',
          entity_type: 'expenses',
          entity_id: expenseId,
        },
      });
    });

    this.logger.log(`🗑 Expense deleted: ${expenseId}`);
    return { id: expenseId };
  }
}
