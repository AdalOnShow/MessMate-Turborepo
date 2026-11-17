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
  BulkMealEntriesDto,
  MealEntryWithMember,
  DailyMealReport,
  MemberMealReport,
  MonthMealSummary,
} from '@repo/shared';
import { entryKey, prepareMealEntries } from './meal-entries';

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
      throw new ForbiddenException({
        message: 'Only managers can record meals',
        code: ErrorCode.MANAGER_ONLY,
      });
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
      throw new NotFoundException({
        message: 'Active month not found',
        code: ErrorCode.NO_ACTIVE_MONTH,
      });
    }

    // One query each instead of one per entry, so a full day for a large
    // mess stays fast.
    const memberIds = [...new Set(data.entries.map((e) => e.memberId))];
    // Invalid dates are rejected by prepareMealEntries below; here they just
    // match nothing.
    const dates = [
      ...new Set(
        data.entries
          .map((e) => new Date(e.date).getTime())
          .filter((t) => !Number.isNaN(t)),
      ),
    ].map((t) => new Date(t));

    const [mealTypes, members, existing] = await Promise.all([
      // Inactive types are included: a saved day can still hold counts for
      // a type that was switched off later.
      prisma.meal_types.findMany({
        where: { mess_id: messId, deleted_at: null },
        select: { id: true },
      }),
      prisma.mess_members.findMany({
        where: {
          id: { in: memberIds },
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
          member_id: { in: memberIds },
          date: { in: dates },
        },
        select: { id: true, member_id: true, date: true, meals: true },
      }),
    ]);

    // Every member must belong to this mess, or a manager could write meals
    // for someone in another mess.
    if (members.length !== memberIds.length) {
      throw new BadRequestException({
        message: 'Some members are not active members of this mess',
        code: ErrorCode.VALIDATION_FAILED,
      });
    }

    const prepared = prepareMealEntries(data.entries, {
      liveMealTypeIds: new Set(mealTypes.map((mt) => mt.id)),
      existingMeals: new Map(
        existing.map((e) => [
          entryKey(e.member_id, e.date),
          e.meals as Record<string, number>,
        ]),
      ),
      monthStartedAt: month.started_at,
      now: new Date(),
    });

    const existingId = new Map(
      existing.map((e) => [entryKey(e.member_id, e.date), e.id]),
    );

    // All rows and their activity logs are saved together, or none are.
    const savedIds = await prisma.$transaction(
      async (tx) => {
        const ids: string[] = [];
        const logs: Prisma.activity_logsCreateManyInput[] = [];

        for (const p of prepared) {
          const id = existingId.get(entryKey(p.memberId, p.date));
          if (id) {
            await tx.meal_entries.update({
              where: { id },
              data: {
                meals: p.meals,
                total_meal: p.totalMeal,
                updated_at: new Date(),
              },
              select: { id: true },
            });
            ids.push(id);
            logs.push({
              mess_id: messId,
              month_id: monthId,
              actor_id: actorId,
              action: 'MEAL_UPDATED',
              entity_type: 'meal_entries',
              entity_id: id,
            });
          } else {
            const created = await tx.meal_entries.create({
              data: {
                month_id: monthId,
                member_id: p.memberId,
                date: p.date,
                meals: p.meals,
                total_meal: p.totalMeal,
                created_by: actorId,
              },
              select: { id: true },
            });
            ids.push(created.id);
            logs.push({
              mess_id: messId,
              month_id: monthId,
              actor_id: actorId,
              action: 'MEAL_ADDED',
              entity_type: 'meal_entries',
              entity_id: created.id,
            });
          }
        }

        await tx.activity_logs.createMany({ data: logs });
        return ids;
      },
      { timeout: 20_000, maxWait: 10_000 },
    );

    const savedRows = await prisma.meal_entries.findMany({
      where: { id: { in: savedIds } },
      include: {
        member: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    const results: MealEntryWithMember[] = savedRows.map((saved) => ({
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
    }));

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
        // The guard only proves membership of messId; the month must belong
        // to that mess too, or any member could read another mess's meals.
        month: { mess_id: messId },
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
      throw new ForbiddenException({
        message: 'Only managers can delete meals',
        code: ErrorCode.MANAGER_ONLY,
      });
    }

    // Scoped to this mess's active month: the manager check above is only
    // for messId, and closed months are already billed.
    const entry = await prisma.meal_entries.findFirst({
      where: {
        id: entryId,
        deleted_at: null,
        month: { mess_id: messId, month_status: 'ACTIVE', deleted_at: null },
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
        month: { mess_id: messId },
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
        month: { mess_id: messId },
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
          (month.ended_at ?? new Date()).getTime() - month.started_at.getTime(),
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
