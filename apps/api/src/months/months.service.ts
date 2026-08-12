import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@repo/database';
import type { MonthResponse, MonthSummaryResponse, MemberMonthSummary } from '@repo/shared';

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
      throw new ForbiddenException('Only managers can create months');
    }

    const activeMonth = await prisma.months.findFirst({
      where: {
        mess_id: messId,
        month_status: 'ACTIVE',
        deleted_at: null,
      },
    });

    if (activeMonth) {
      await this.closeMonth(messId, activeMonth.id, actorId);
    }

    const now = new Date();
    const monthTitle =
      title?.trim() ||
      now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const month = await prisma.months.create({
      data: {
        mess_id: messId,
        title: monthTitle,
        month_status: 'ACTIVE',
        started_at: now,
        created_by: actorId,
      },
    });

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
      throw new NotFoundException('Active month not found');
    }

    const activeMembers = await prisma.mess_members.findMany({
      where: {
        mess_id: messId,
        removed_at: null,
        deleted_at: null,
      },
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
    });

    const memberIds = activeMembers.map((m) => m.id);

    const mealEntries = await prisma.meal_entries.findMany({
      where: {
        month_id: monthId,
        deleted_at: null,
      },
    });

    const totalMealsAll = mealEntries.reduce(
      (sum, e) => sum + Number(e.total_meal),
      0,
    );

    const expenses = await prisma.expenses.findMany({
      where: {
        month_id: monthId,
      },
      include: {
        members: true,
      },
    });

    const deposits = await prisma.deposits.findMany({
      where: {
        month_id: monthId,
      },
    });

    const totalMealCost = expenses
      .filter((e) => e.type === 'BAZAAR' || e.type === 'SHARED')
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const mealRate = totalMealsAll > 0 ? totalMealCost / totalMealsAll : 0;

    const summaries: MemberMonthSummary[] = [];

    for (const memberId of memberIds) {
      const memberMeals = mealEntries
        .filter((e) => e.member_id === memberId)
        .reduce((sum, e) => sum + Number(e.total_meal), 0);

      const memberMealCost = memberMeals * mealRate;

      const memberSharedCost = expenses
        .filter((e) => e.type === 'SHARED' || e.type === 'BAZAAR')
        .reduce((sum, expense) => {
          const alloc = expense.members.find(
            (m) => m.member_id === memberId,
          );
          return sum + (alloc ? Number(alloc.allocated_amount) : 0);
        }, 0);

      const memberIndividualCost = expenses
        .filter((e) => e.type === 'INDIVIDUAL')
        .reduce((sum, expense) => {
          const alloc = expense.members.find(
            (m) => m.member_id === memberId,
          );
          return sum + (alloc ? Number(alloc.allocated_amount) : 0);
        }, 0);

      const memberDeposits = deposits
        .filter((d) => d.member_id === memberId)
        .reduce((sum, d) => sum + Number(d.amount), 0);

      const finalBill = memberMealCost + memberSharedCost + memberIndividualCost;
      const finalBalance = memberDeposits - finalBill;

      const summary = await prisma.member_month_summaries.create({
        data: {
          month_id: monthId,
          member_id: memberId,
          total_meals: memberMeals,
          meal_cost: memberMealCost,
          shared_cost: memberSharedCost,
          individual_cost: memberIndividualCost,
          deposit_amount: memberDeposits,
          final_bill: finalBill,
          final_balance: finalBalance,
        },
      });

      summaries.push({
        id: summary.id,
        member_id: summary.member_id,
        user: activeMembers.find((m) => m.id === memberId)!.user,
        total_meals: summary.total_meals,
        meal_cost: Number(summary.meal_cost),
        shared_cost: Number(summary.shared_cost),
        individual_cost: Number(summary.individual_cost),
        deposit_amount: Number(summary.deposit_amount),
        final_bill: Number(summary.final_bill),
        final_balance: Number(summary.final_balance),
      });
    }

    for (const summary of summaries) {
      if (summary.final_balance !== 0) {
        const nextMonth = await prisma.months.findFirst({
          where: {
            mess_id: messId,
            month_status: 'ACTIVE',
            deleted_at: null,
            id: { not: monthId },
          },
        });

        if (nextMonth) {
          await prisma.carry_forward_balances.create({
            data: {
              source_month_id: monthId,
              target_month_id: nextMonth.id,
              member_id: summary.member_id,
              amount: Math.abs(summary.final_balance),
              carry_forward_type:
                summary.final_balance > 0
                  ? 'PREVIOUS_BALANCE'
                  : 'PREVIOUS_DUE',
            },
          });
        }
      }
    }

    await prisma.months.update({
      where: { id: monthId },
      data: {
        month_status: 'ARCHIVED',
        ended_at: new Date(),
        updated_at: new Date(),
      },
    });

    await prisma.activity_logs.create({
      data: {
        mess_id: messId,
        month_id: monthId,
        actor_id: actorId,
        action: 'MONTH_CLOSED',
        entity_type: 'months',
        entity_id: monthId,
      },
    });

    this.logger.log(`✅ Month closed: ${monthId}`);
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

  private mapMonthResponse(month: any): MonthResponse {
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
