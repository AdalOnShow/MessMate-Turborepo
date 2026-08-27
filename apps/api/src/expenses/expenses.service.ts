import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@repo/database';
import type {
  CreateExpenseDto,
  ExpenseListResponse,
  ExpenseWithRelations,
  UpdateExpenseDto,
} from '@repo/shared';

const memberSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
} as const;

const expenseInclude = {
  creator: { select: memberSelect },
  members: {
    include: {
      member: { select: memberSelect },
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
    note: row.note ?? null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    creator: row.creator,
    members: row.members.map((alloc) => ({
      member_id: alloc.member_id,
      allocated_amount: Number(alloc.allocated_amount),
      member: alloc.member,
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
      throw new ForbiddenException('Only managers can manage expenses');
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
      throw new NotFoundException('Active month not found');
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
      throw new BadRequestException(
        'One or more selected members are not active members of this mess',
      );
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
          note: data.note || null,
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
      throw new ForbiddenException(
        'You must be an active member to view expenses',
      );
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

  async updateExpense(
    messId: string,
    expenseId: string,
    actorId: string,
    data: UpdateExpenseDto,
  ): Promise<ExpenseWithRelations> {
    await this.requireManager(messId, actorId);

    const expense = await prisma.expenses.findFirst({
      where: { id: expenseId, mess_id: messId },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.type === 'BAZAAR') {
      throw new ForbiddenException(
        'Bazaar expenses are locked and cannot be edited',
      );
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
      throw new BadRequestException(
        'Expense must have at least one allocated member',
      );
    }

    if (type === 'INDIVIDUAL' && effectiveMemberIds.length !== 1) {
      throw new BadRequestException(
        'Individual expenses must be assigned to exactly one member',
      );
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
          note: data.note !== undefined ? data.note || null : expense.note,
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
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (expense.type === 'BAZAAR') {
      throw new ForbiddenException(
        'Bazaar expenses are locked and cannot be deleted',
      );
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
