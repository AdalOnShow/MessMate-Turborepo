import { ErrorCode } from '@repo/shared';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type Prisma, prisma } from '@repo/database';
import type { MonthResponse, MonthSummaryResponse } from '@repo/shared';

@Injectable()
export class MonthsService {
  private readonly logger = new Logger(MonthsService.name);

  async getActiveMonth(messId: string): Promise<MonthResponse | null> {
    const month = await prisma.months.findFirst({
      where: {
        mess_id: messId,
        month_status: 'ACTIVE',
        deleted_at: null,
      },
    });

    if (!month) return null;

    return this.mapMonthResponse(month);
  }

  async createMonth(
    messId: string,
    actorId: string,
    title?: string,
  ): Promise<MonthResponse> {
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
        message: 'Only managers can create months',
        code: ErrorCode.MANAGER_ONLY,
      });
    }

    const activeMonth = await prisma.months.findFirst({
      where: {
        mess_id: messId,
        month_status: 'ACTIVE',
        deleted_at: null,
      },
    });

    const now = new Date();

    // Starting a month closes the current one, which cannot be undone. A
    // repeated request right after a month was opened is almost certainly a
    // double submit (slow response, second click), so refuse it.
    if (
      activeMonth &&
      now.getTime() - activeMonth.started_at.getTime() < 60_000
    ) {
      throw new ConflictException({
        message: `"${activeMonth.title}" was started less than a minute ago. Refresh the page to see it.`,
        code: ErrorCode.MONTH_ALREADY_ACTIVE,
      });
    }

    if (activeMonth) {
      await this.closeMonth(messId, activeMonth.id, actorId);
    }

    const monthTitle = await this.uniqueMonthTitle(
      messId,
      title?.trim() ||
        now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    );

    const month = await prisma.months.create({
      data: {
        mess_id: messId,
        title: monthTitle,
        month_status: 'ACTIVE',
        started_at: now,
        created_by: actorId,
      },
    });

    if (activeMonth) {
      await this.generateCarryForward(messId, activeMonth.id, month.id);
    }

    await prisma.activity_logs.create({
      data: {
        mess_id: messId,
        month_id: month.id,
        actor_id: actorId,
        action: 'MONTH_OPENED',
        entity_type: 'months',
        entity_id: month.id,
      },
    });

    this.logger.log(`✅ Month created: ${month.id} (${monthTitle})`);

    return this.mapMonthResponse(month);
  }

  async closeMonth(
    messId: string,
    monthId: string,
    actorId: string,
  ): Promise<void> {
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

    const [activeMembers, mealEntries, expenses, deposits] = await Promise.all([
      prisma.mess_members.findMany({
        where: {
          mess_id: messId,
          removed_at: null,
          deleted_at: null,
        },
        select: { id: true },
      }),
      prisma.meal_entries.findMany({
        where: {
          month_id: monthId,
          deleted_at: null,
        },
      }),
      prisma.expenses.findMany({
        where: {
          month_id: monthId,
        },
        include: {
          members: true,
        },
      }),
      prisma.deposits.findMany({
        where: {
          month_id: monthId,
        },
      }),
    ]);

    const memberIds = activeMembers.map((m) => m.id);

    const totalMealsAll = mealEntries.reduce(
      (sum, e) => sum + Number(e.total_meal),
      0,
    );

    const totalMealCost = expenses
      .filter((e) => e.type === 'BAZAAR')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const mealRate = totalMealsAll > 0 ? totalMealCost / totalMealsAll : 0;

    const summaries = memberIds.map((memberId) => {
      const memberMeals = mealEntries
        .filter((e) => e.member_id === memberId)
        .reduce((sum, e) => sum + Number(e.total_meal), 0);

      const memberMealCost = memberMeals * mealRate;

      const memberSharedCost = expenses
        .filter((e) => e.type === 'SHARED')
        .reduce((sum, expense) => {
          const alloc = expense.members.find((m) => m.member_id === memberId);
          return sum + (alloc ? Number(alloc.allocated_amount) : 0);
        }, 0);

      const memberIndividualCost = expenses
        .filter((e) => e.type === 'INDIVIDUAL')
        .reduce((sum, expense) => {
          const alloc = expense.members.find((m) => m.member_id === memberId);
          return sum + (alloc ? Number(alloc.allocated_amount) : 0);
        }, 0);

      const memberDeposits = deposits
        .filter((d) => d.member_id === memberId)
        .reduce((sum, d) => sum + Number(d.amount), 0);

      const finalBill =
        memberMealCost + memberSharedCost + memberIndividualCost;
      const finalBalance = memberDeposits - finalBill;

      return {
        month_id: monthId,
        member_id: memberId,
        total_meals: memberMeals,
        meal_cost: memberMealCost,
        shared_cost: memberSharedCost,
        individual_cost: memberIndividualCost,
        deposit_amount: memberDeposits,
        final_bill: finalBill,
        final_balance: finalBalance,
      };
    });

    // Archive, summaries and log are written together. The status-guarded
    // update is the claim: if another request already closed this month,
    // nothing is written twice.
    await prisma.$transaction(async (tx) => {
      const closedAt = new Date();
      const claimed = await tx.months.updateMany({
        where: { id: monthId, month_status: 'ACTIVE' },
        data: {
          month_status: 'ARCHIVED',
          ended_at: closedAt,
          updated_at: closedAt,
        },
      });

      if (claimed.count === 0) {
        throw new ConflictException({
          message: 'This month has already been closed',
          code: ErrorCode.MONTH_ALREADY_CLOSED,
        });
      }

      if (summaries.length > 0) {
        await tx.member_month_summaries.createMany({ data: summaries });
      }

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: monthId,
          actor_id: actorId,
          action: 'MONTH_CLOSED',
          entity_type: 'months',
          entity_id: monthId,
        },
      });
    });

    this.logger.log(`✅ Month closed: ${monthId}`);
  }

  private async generateCarryForward(
    messId: string,
    sourceMonthId: string,
    targetMonthId: string,
  ): Promise<void> {
    const summaries = await prisma.member_month_summaries.findMany({
      where: { month_id: sourceMonthId },
    });

    const rows = summaries
      .map((summary) => ({
        summary,
        finalBalance: Number(summary.final_balance),
      }))
      .filter(({ finalBalance }) => finalBalance !== 0)
      .map(({ summary, finalBalance }) => ({
        source_month_id: sourceMonthId,
        target_month_id: targetMonthId,
        member_id: summary.member_id,
        amount: Math.abs(finalBalance),
        carry_forward_type:
          finalBalance > 0
            ? ('PREVIOUS_BALANCE' as const)
            : ('PREVIOUS_DUE' as const),
      }));

    if (rows.length > 0) {
      await prisma.carry_forward_balances.createMany({ data: rows });
    }
  }

  /**
   * Month titles are how people pick a month in lists and report selectors,
   * so two months in one mess must never share a title. A clash gets a
   * numeric suffix: "November 2026", "November 2026 (2)", ...
   */
  private async uniqueMonthTitle(
    messId: string,
    baseTitle: string,
  ): Promise<string> {
    const existing = await prisma.months.findMany({
      where: {
        mess_id: messId,
        deleted_at: null,
        title: { startsWith: baseTitle },
      },
      select: { title: true },
    });
    const taken = new Set(existing.map((m) => m.title));

    if (!taken.has(baseTitle)) return baseTitle;

    let n = 2;
    while (taken.has(`${baseTitle} (${n})`)) n += 1;
    return `${baseTitle} (${n})`;
  }

  async getMonthHistory(messId: string): Promise<MonthResponse[]> {
    const months = await prisma.months.findMany({
      where: {
        mess_id: messId,
        deleted_at: null,
      },
      orderBy: { started_at: 'desc' },
    });

    return months.map((m) => this.mapMonthResponse(m));
  }

  async getMonthSummary(
    messId: string,
    monthId: string,
  ): Promise<MonthSummaryResponse> {
    const month = await prisma.months.findFirst({
      where: {
        id: monthId,
        mess_id: messId,
        deleted_at: null,
      },
    });

    if (!month) {
      throw new NotFoundException('Month not found');
    }

    const summaries = await prisma.member_month_summaries.findMany({
      where: { month_id: monthId },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return {
      month: this.mapMonthResponse(month),
      member_summaries: summaries.map((s) => ({
        id: s.id,
        member_id: s.member_id,
        user: s.member.user,
        total_meals: s.total_meals,
        meal_cost: Number(s.meal_cost),
        shared_cost: Number(s.shared_cost),
        individual_cost: Number(s.individual_cost),
        deposit_amount: Number(s.deposit_amount),
        final_bill: Number(s.final_bill),
        final_balance: Number(s.final_balance),
      })),
    };
  }

  private mapMonthResponse(
    month: Prisma.monthsGetPayload<object>,
  ): MonthResponse {
    return {
      id: month.id,
      mess_id: month.mess_id,
      title: month.title,
      month_status: month.month_status,
      started_at: month.started_at.toISOString(),
      ended_at: month.ended_at?.toISOString() ?? null,
      created_by: month.created_by,
      created_at: month.created_at.toISOString(),
      updated_at: month.updated_at.toISOString(),
    };
  }
}
