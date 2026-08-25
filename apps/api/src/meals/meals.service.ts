import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@repo/database';
import type { BulkMealEntriesDto, MealEntryWithMember } from '@repo/shared';

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

    await prisma.meal_entries.update({
      where: { id: entryId },
      data: { deleted_at: new Date() },
    });

    this.logger.log(`✅ Meal entry deleted: ${entryId}`);

    return { success: true };
  }
}
