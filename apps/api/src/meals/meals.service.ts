import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@repo/database';
import type {
  BulkMealEntriesDto,
  MealEntryWithMember,
  DailyMealReport,
  MemberMealReport,
  MonthMealSummary,
} from '@repo/shared';

@Injectable()
export class MealsService {
  private readonly logger = new Logger(MealsService.name);

  async bulkSaveMealEntries(
    messId: string,
    monthId: string,
    actorId: string,
    data: BulkMealEntriesDto,
  ): Promise<MealEntryWithMember[]> {
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
      throw new ForbiddenException('Only managers can record meals');
    }

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

    const activeMealTypes = await prisma.meal_types.findMany({
      where: {
        mess_id: messId,
        is_active: true,
        deleted_at: null,
      },
    });

    const mealTypeValues: Record<string, number> = {};
    for (const mt of activeMealTypes) {
      mealTypeValues[mt.id] = Number(mt.value);
    }

    const results: MealEntryWithMember[] = [];

    for (const entry of data.entries) {
      const totalMeal = Object.entries(entry.meals).reduce(
        (sum, [mealTypeId, quantity]) => {
          const value = mealTypeValues[mealTypeId] ?? 1;
          return sum + quantity * value;
        },
        0,
      );

      const existing = await prisma.meal_entries.findFirst({
        where: {
          month_id: monthId,
          member_id: entry.memberId,
          date: new Date(entry.date),
          deleted_at: null,
        },
      });

      let saved;
      if (existing) {
        saved = await prisma.meal_entries.update({
          where: { id: existing.id },
          data: {
            meals: entry.meals,
            total_meal: totalMeal,
            updated_at: new Date(),
          },
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

        await prisma.activity_logs.create({
          data: {
            mess_id: messId,
            month_id: monthId,
            actor_id: actorId,
            action: 'MEAL_UPDATED',
            entity_type: 'meal_entries',
            entity_id: saved.id,
          },
        });
      } else {
        saved = await prisma.meal_entries.create({
          data: {
            month_id: monthId,
            member_id: entry.memberId,
            date: new Date(entry.date),
            meals: entry.meals,
            total_meal: totalMeal,
            created_by: actorId,
          },
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

        await prisma.activity_logs.create({
          data: {
            mess_id: messId,
            month_id: monthId,
            actor_id: actorId,
            action: 'MEAL_ADDED',
            entity_type: 'meal_entries',
            entity_id: saved.id,
          },
        });
      }

      results.push({
        id: saved.id,
        month_id: saved.month_id,
        member_id: saved.member_id,
        date: saved.date.toISOString(),
        meals: saved.meals as Record<string, number>,
        total_meal: Number(saved.total_meal),
        created_by: saved.created_by,
        created_at: saved.created_at.toISOString(),
        updated_at: saved.updated_at.toISOString(),
        member: {
          id: saved.member.id,
          user: saved.member.user,
        },
      });
    }

    this.logger.log(
      `✅ Bulk meal entries saved: ${results.length} entries for month ${monthId}`,
    );

    return results;
  }

  async getMealEntries(
    messId: string,
    monthId: string,
    startDate: string,
    endDate: string,
  ): Promise<MealEntryWithMember[]> {
    const entries = await prisma.meal_entries.findMany({
      where: {
        month_id: monthId,
        deleted_at: null,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
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
      orderBy: [{ date: 'asc' }, { member: { user: { name: 'asc' } } }],
    });

    return entries.map((e) => ({
      id: e.id,
      month_id: e.month_id,
      member_id: e.member_id,
      date: e.date.toISOString(),
      meals: e.meals as Record<string, number>,
      total_meal: Number(e.total_meal),
      created_by: e.created_by,
      created_at: e.created_at.toISOString(),
      updated_at: e.updated_at.toISOString(),
      member: {
        id: e.member.id,
        user: e.member.user,
      },
    }));
  }

  async deleteMealEntry(
    messId: string,
    entryId: string,
    actorId: string,
  ): Promise<{ success: true }> {
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
      throw new ForbiddenException('Only managers can delete meals');
    }

    const entry = await prisma.meal_entries.findFirst({
      where: {
        id: entryId,
        deleted_at: null,
      },
    });

    if (!entry) {
      throw new NotFoundException('Meal entry not found');
    }

    await prisma.$transaction(async (tx) => {
      await tx.meal_entries.update({
        where: { id: entryId },
        data: { deleted_at: new Date() },
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          month_id: entry.month_id,
          actor_id: actorId,
          action: 'MEAL_DELETED',
          entity_type: 'meal_entries',
          entity_id: entryId,
        },
      });
    });

    this.logger.log(`✅ Meal entry deleted: ${entryId}`);

    return { success: true };
  }

  async getDailyMealReport(
    messId: string,
    monthId: string,
    date: string,
  ): Promise<DailyMealReport> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const entries = await prisma.meal_entries.findMany({
      where: {
        month_id: monthId,
        deleted_at: null,
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
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
      orderBy: { member: { user: { name: 'asc' } } },
    });

    const mealTypeTotals: Record<string, number> = {};
    let totalMeals = 0;

    for (const entry of entries) {
      const meals = entry.meals as Record<string, number>;
      for (const [key, val] of Object.entries(meals)) {
        mealTypeTotals[key] = (mealTypeTotals[key] ?? 0) + val;
        totalMeals += val;
      }
    }

    return {
      date,
      entries: entries.map((e) => ({
        member_id: e.member_id,
        user: e.member.user,
        meals: e.meals as Record<string, number>,
        total_meal: Number(e.total_meal),
      })),
      summary: {
        total_members: entries.length,
        total_meals: totalMeals,
        meal_type_totals: mealTypeTotals,
      },
    };
  }

  async getMemberMealReport(
    messId: string,
    monthId: string,
    memberId: string,
  ): Promise<MemberMealReport> {
    const member = await prisma.mess_members.findFirst({
      where: {
        id: memberId,
        mess_id: messId,
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

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const entries = await prisma.meal_entries.findMany({
      where: {
        month_id: monthId,
        member_id: memberId,
        deleted_at: null,
      },
      orderBy: { date: 'asc' },
    });

    const mealTypeTotals: Record<string, number> = {};
    let totalMeals = 0;

    for (const entry of entries) {
      const meals = entry.meals as Record<string, number>;
      for (const [key, val] of Object.entries(meals)) {
        mealTypeTotals[key] = (mealTypeTotals[key] ?? 0) + val;
        totalMeals += val;
      }
    }

    const month = await prisma.months.findFirst({
      where: { id: monthId },
    });

    let averagePerDay = 0;
    if (month) {
      const daysDiff = Math.max(
        1,
        Math.ceil(
          (month.ended_at ?? new Date()).getTime() -
            month.started_at.getTime(),
        ) /
          (1000 * 60 * 60 * 24),
      );
      averagePerDay = totalMeals / daysDiff;
    }

    return {
      member_id: memberId,
      user: member.user,
      month_id: monthId,
      entries: entries.map((e) => ({
        date: e.date.toISOString(),
        meals: e.meals as Record<string, number>,
        total_meal: Number(e.total_meal),
      })),
      summary: {
        total_entries: entries.length,
        total_meals: totalMeals,
        meal_type_totals: mealTypeTotals,
        average_meals_per_day: Math.round(averagePerDay * 100) / 100,
      },
    };
  }

  async getMonthMealSummary(
    messId: string,
    monthId: string,
  ): Promise<MonthMealSummary> {
    const month = await prisma.months.findFirst({
      where: { id: monthId, mess_id: messId, deleted_at: null },
    });

    if (!month) {
      throw new NotFoundException('Month not found');
    }

    const entries = await prisma.meal_entries.findMany({
      where: {
        month_id: monthId,
        deleted_at: null,
      },
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

    const memberMap = new Map<
      string,
      {
        member_id: string;
        user: (typeof entries)[0]['member']['user'];
        total_meals: number;
        meal_type_totals: Record<string, number>;
        entry_count: number;
      }
    >();

    const mealTypeTotals: Record<string, number> = {};
    let totalMeals = 0;
    const activeDays = new Set<string>();

    for (const entry of entries) {
      const meals = entry.meals as Record<string, number>;
      const dateKey = entry.date.toISOString().split('T')[0]!;
      activeDays.add(dateKey);

      let entryTotal = 0;
      for (const [key, val] of Object.entries(meals)) {
        mealTypeTotals[key] = (mealTypeTotals[key] ?? 0) + val;
        entryTotal += val;
      }
      totalMeals += entryTotal;

      const existing = memberMap.get(entry.member_id);
      if (existing) {
        existing.total_meals += entryTotal;
        existing.entry_count += 1;
        for (const [key, val] of Object.entries(meals)) {
          existing.meal_type_totals[key] =
            (existing.meal_type_totals[key] ?? 0) + val;
        }
      } else {
        const mtTotals: Record<string, number> = {};
        for (const [key, val] of Object.entries(meals)) {
          mtTotals[key] = val;
        }
        memberMap.set(entry.member_id, {
          member_id: entry.member_id,
          user: entry.member.user,
          total_meals: entryTotal,
          meal_type_totals: mtTotals,
          entry_count: 1,
        });
      }
    }

    return {
      month_id: monthId,
      title: month.title,
      total_entries: entries.length,
      total_meals: totalMeals,
      member_summaries: Array.from(memberMap.values()).sort(
        (a, b) => b.total_meals - a.total_meals,
      ),
      meal_type_totals: mealTypeTotals,
      active_days: activeDays.size,
    };
  }
}
