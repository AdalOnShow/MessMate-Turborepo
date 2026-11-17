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
  type CreateMessDto,
  type UpdateMessDto,
  type CreateMealTypeDto,
  type UpdateMealTypeDto,
  ErrorCode,
} from '@repo/shared';
import type {
  ActivityLog,
  MemberCalculationList,
  MemberDashboard,
  MemberFilters,
  MessDashboard,
  MessMemberWithUser,
} from '@repo/shared';
import { computeMemberSummaries, roundMoney } from '../months/month-summary';

export type MessWithMembership = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
  current_user_role: string;
  member_id: string;
};

@Injectable()
export class MessesService {
  private readonly logger = new Logger(MessesService.name);

  async createMess(
    userId: string,
    data: CreateMessDto,
  ): Promise<MessWithMembership> {
    const name = data.name.trim();
    const description = data.description?.trim();

    // ADR-003: one active mess per user. Checked up front so the user gets
    // a clear error instead of a unique-index failure.
    const activeMembership = await prisma.mess_members.findFirst({
      where: { user_id: userId, removed_at: null, deleted_at: null },
      select: { id: true },
    });
    if (activeMembership) {
      throw new ConflictException({
        message:
          'You are already in a mess. Leave it before creating a new one.',
        code: ErrorCode.ALREADY_IN_MESS,
      });
    }

    const baseSlug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `mess-${Date.now().toString(36)}`;
    const slug = await this.uniqueSlug(baseSlug);

    this.logger.log(`📝 Creating mess '${name}' for user ${userId}`);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const mess = await tx.messes.create({
          data: {
            name,
            slug,
            description,
            created_by: userId,
          },
        });

        const member = await tx.mess_members.create({
          data: {
            mess_id: mess.id,
            user_id: userId,
            mess_role: 'MANAGER',
          },
        });

        await tx.activity_logs.create({
          data: {
            mess_id: mess.id,
            actor_id: userId,
            action: 'MANAGER_ASSIGNED',
            entity_type: 'mess_members',
            entity_id: member.id,
          },
        });

        await tx.meal_types.createMany({
          data: [
            { mess_id: mess.id, name: 'Lunch', value: 1, is_active: true },
            { mess_id: mess.id, name: 'Dinner', value: 1, is_active: true },
          ],
        });

        return { mess, member_id: member.id };
      });

      this.logger.log(`✅ Mess created: ${result.mess.id}`);

      return {
        id: result.mess.id,
        name: result.mess.name,
        slug: result.mess.slug,
        description: result.mess.description ?? undefined,
        created_at: result.mess.created_at.toISOString(),
        updated_at: result.mess.updated_at.toISOString(),
        current_user_role: 'MANAGER',
        member_id: result.member_id,
      };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Lost a race with a concurrent create (same slug, or the user
          // joined/created another mess in the meantime).
          throw new ConflictException({
            message:
              'Could not create the mess. You may already be in a mess, or the name was just taken. Please try again.',
            code: ErrorCode.DUPLICATE_RESOURCE,
          });
        }
      }
      throw error;
    }
  }

  /**
   * Slugs are unique across all messes, but two messes may share a name:
   * "green-villa", "green-villa-2", ...
   */
  private async uniqueSlug(base: string): Promise<string> {
    const taken = new Set(
      (
        await prisma.messes.findMany({
          where: { slug: { startsWith: base } },
          select: { slug: true },
        })
      ).map((m) => m.slug),
    );
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}-${n}`)) n += 1;
    return `${base}-${n}`;
  }

  async getMyMess(userId: string): Promise<MessWithMembership | null> {
    const membership = await prisma.mess_members.findFirst({
      where: {
        user_id: userId,
        deleted_at: null,
        removed_at: null,
      },
      orderBy: {
        joined_at: 'desc',
      },
      include: {
        mess: true,
      },
    });

    if (!membership) {
      return null;
    }

    return {
      id: membership.mess.id,
      name: membership.mess.name,
      slug: membership.mess.slug,
      description: membership.mess.description ?? undefined,
      created_at: membership.mess.created_at.toISOString(),
      updated_at: membership.mess.updated_at.toISOString(),
      current_user_role: membership.mess_role,
      member_id: membership.id,
    };
  }

  async getMembers(
    messId: string,
    filters?: MemberFilters,
  ): Promise<MessMemberWithUser[]> {
    const where: Prisma.mess_membersWhereInput = {
      mess_id: messId,
      deleted_at: null,
    };

    if (filters?.role) {
      where.mess_role = filters.role;
    }

    if (filters?.status === 'ACTIVE') {
      where.removed_at = null;
    } else if (filters?.status === 'REMOVED') {
      where.removed_at = { not: null };
    }

    if (filters?.search) {
      where.user = {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
    }

    const members = await prisma.mess_members.findMany({
      where,
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
      orderBy: { joined_at: 'desc' },
    });

    return members.map((m) => ({
      id: m.id,
      mess_id: m.mess_id,
      user_id: m.user_id,
      mess_role: m.mess_role as 'MANAGER' | 'MEMBER',
      joined_at: m.joined_at.toISOString(),
      removed_at: m.removed_at?.toISOString() ?? null,
      user: m.user,
    }));
  }

  async getMemberCalculations(messId: string): Promise<MemberCalculationList> {
    const month = await prisma.months.findFirst({
      where: {
        mess_id: messId,
        month_status: 'ACTIVE',
        deleted_at: null,
      },
    });

    if (!month) {
      return {
        month_id: '',
        month_title: 'No active month',
        meal_rate: 0,
        items: [],
      };
    }

    const members = await prisma.mess_members.findMany({
      where: {
        mess_id: messId,
        removed_at: null,
        deleted_at: null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { joined_at: 'asc' },
    });

    const [mealEntries, expenses, deposits, carries] = await Promise.all([
      prisma.meal_entries.findMany({
        where: { month_id: month.id, deleted_at: null },
        select: { member_id: true, total_meal: true },
      }),
      prisma.expenses.findMany({
        where: { mess_id: messId, month_id: month.id },
        select: {
          id: true,
          type: true,
          amount: true,
          members: {
            select: { member_id: true, allocated_amount: true },
          },
        },
      }),
      prisma.deposits.findMany({
        where: { mess_id: messId, month_id: month.id, deleted_at: null },
        select: { member_id: true, amount: true },
      }),
      prisma.carry_forward_balances.findMany({
        where: { target_month_id: month.id },
        select: { member_id: true, amount: true, carry_forward_type: true },
      }),
    ]);

    // Same maths as month close, without carries: those are shown
    // separately as the previous balance.
    const { mealRate, rows } = computeMemberSummaries(month.id, {
      activeMemberIds: members.map((m) => m.id),
      mealEntries,
      expenses,
      deposits,
    });
    const rowByMember = new Map(rows.map((r) => [r.member_id, r]));

    const previousByMember = new Map<string, number>();
    for (const c of carries) {
      const signed =
        c.carry_forward_type === 'PREVIOUS_BALANCE'
          ? Number(c.amount)
          : -Number(c.amount);
      previousByMember.set(
        c.member_id,
        (previousByMember.get(c.member_id) ?? 0) + signed,
      );
    }

    const items = members.map((m) => {
      const r = rowByMember.get(m.id)!;
      const previousBalance = roundMoney(previousByMember.get(m.id) ?? 0);

      return {
        member_id: m.id,
        user_id: m.user_id,
        mess_role: m.mess_role as 'MANAGER' | 'MEMBER',
        removed_at: m.removed_at?.toISOString() ?? null,
        user: m.user,
        total_meals: r.total_meals,
        meal_cost: r.meal_cost,
        shared_cost: r.shared_cost,
        individual_cost: r.individual_cost,
        deposit_amount: r.deposit_amount,
        final_bill: r.final_bill,
        final_balance: r.final_balance,
        previous_balance: previousBalance,
        current_balance: roundMoney(r.final_balance + previousBalance),
      };
    });

    return {
      month_id: month.id,
      month_title: month.title,
      meal_rate: mealRate,
      items,
    };
  }

  async getDashboard(messId: string): Promise<MessDashboard> {
    const calculations = await this.getMemberCalculations(messId);

    const totalMeals = calculations.items.reduce(
      (sum, i) => sum + i.total_meals,
      0,
    );
    const totalDeposits = calculations.items.reduce(
      (sum, i) => sum + i.deposit_amount,
      0,
    );
    const totalBill = calculations.items.reduce(
      (sum, i) => sum + i.final_bill,
      0,
    );
    const totalBalance = calculations.items.reduce(
      (sum, i) => sum + i.current_balance,
      0,
    );

    return {
      month_id: calculations.month_id,
      month_title: calculations.month_title,
      meal_rate: calculations.meal_rate,
      total_members: calculations.items.length,
      total_meals: totalMeals,
      total_deposits: totalDeposits,
      total_expenses: totalBill,
      total_bill: totalBill,
      total_balance: totalBalance,
    };
  }

  async getMemberDashboard(
    messId: string,
    userId: string,
  ): Promise<MemberDashboard> {
    const calculations = await this.getMemberCalculations(messId);
    const mine = calculations.items.find((item) => item.user_id === userId);

    return {
      month_id: calculations.month_id,
      month_title: calculations.month_title,
      meal_rate: calculations.meal_rate,
      total_meals: mine?.total_meals ?? 0,
      meal_cost: mine?.meal_cost ?? 0,
      shared_cost: mine?.shared_cost ?? 0,
      individual_cost: mine?.individual_cost ?? 0,
      deposit_amount: mine?.deposit_amount ?? 0,
      final_bill: mine?.final_bill ?? 0,
      previous_balance: mine?.previous_balance ?? 0,
      current_balance: mine?.current_balance ?? 0,
    };
  }

  async getRecentActivities(
    messId: string,
    limit = 10,
  ): Promise<ActivityLog[]> {
    const logs = await prisma.activity_logs.findMany({
      where: { mess_id: messId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        actor: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      created_at: log.created_at.toISOString(),
      actor: log.actor,
    }));
  }

  async removeMember(
    messId: string,
    actorId: string,
    userId: string,
  ): Promise<{ success: true }> {
    if (actorId === userId) {
      throw new BadRequestException({
        message: 'You cannot remove yourself from the mess',
        code: ErrorCode.CANNOT_REMOVE_SELF,
      });
    }

    await prisma.$transaction(async (tx) => {
      const member = await tx.mess_members.findFirst({
        where: {
          mess_id: messId,
          user_id: userId,
          removed_at: null,
          deleted_at: null,
        },
      });

      if (!member) {
        throw new NotFoundException({
          message: 'Member not found',
          code: ErrorCode.MEMBER_NOT_FOUND,
        });
      }

      if (member.mess_role === 'MANAGER') {
        const managerCount = await tx.mess_members.count({
          where: {
            mess_id: messId,
            mess_role: 'MANAGER',
            removed_at: null,
            deleted_at: null,
          },
        });

        if (managerCount <= 1) {
          throw new BadRequestException({
            message: 'Cannot remove the last manager',
            code: ErrorCode.LAST_MANAGER,
          });
        }
      }

      await tx.mess_members.update({
        where: { id: member.id },
        data: { removed_at: new Date() },
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          actor_id: actorId,
          action: 'MEMBER_REMOVED',
          entity_type: 'mess_members',
          entity_id: member.id,
        },
      });

      return member;
    });

    this.logger.log(`✅ Member removed: ${userId} from mess ${messId}`);

    return { success: true };
  }

  async updateMemberRole(
    messId: string,
    actorId: string,
    userId: string,
    newRole: 'MANAGER' | 'MEMBER',
  ): Promise<MessMemberWithUser> {
    const member = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: userId,
        removed_at: null,
        deleted_at: null,
      },
    });

    if (!member) {
      throw new NotFoundException({
        message: 'Member not found',
        code: ErrorCode.MEMBER_NOT_FOUND,
      });
    }

    // Role change and its activity log succeed or fail together, so a
    // logging failure can no longer report an error for a change that stuck.
    const updated = await prisma.$transaction(async (tx) => {
      const include = {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      } as const;

      // Already in that role: nothing to change (promoting an existing
      // manager used to trip the 2-manager limit).
      if (member.mess_role === newRole) {
        return tx.mess_members.findUniqueOrThrow({
          where: { id: member.id },
          include,
        });
      }

      const managerCount = await tx.mess_members.count({
        where: {
          mess_id: messId,
          mess_role: 'MANAGER',
          removed_at: null,
          deleted_at: null,
        },
      });

      if (newRole === 'MANAGER' && managerCount >= 2) {
        throw new BadRequestException({
          message: 'Maximum 2 managers allowed per mess',
          code: ErrorCode.MANAGER_LIMIT_REACHED,
        });
      }

      // A mess must always keep a manager (same rule as removeMember).
      if (newRole === 'MEMBER' && managerCount <= 1) {
        throw new BadRequestException({
          message: 'Cannot demote the last manager',
          code: ErrorCode.LAST_MANAGER,
        });
      }

      const row = await tx.mess_members.update({
        where: { id: member.id },
        data: { mess_role: newRole },
        include,
      });

      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          actor_id: actorId,
          action:
            newRole === 'MANAGER' ? 'MANAGER_ASSIGNED' : 'MANAGER_REMOVED',
          entity_type: 'mess_members',
          entity_id: row.id,
        },
      });

      return row;
    });

    this.logger.log(
      `✅ Role updated: ${userId} -> ${newRole} in mess ${messId}`,
    );

    return {
      id: updated.id,
      mess_id: updated.mess_id,
      user_id: updated.user_id,
      mess_role: updated.mess_role as 'MANAGER' | 'MEMBER',
      joined_at: updated.joined_at.toISOString(),
      removed_at: updated.removed_at?.toISOString() ?? null,
      user: updated.user,
    };
  }

  async getMealTypes(messId: string) {
    const mealTypes = await prisma.meal_types.findMany({
      where: {
        mess_id: messId,
        deleted_at: null,
      },
      orderBy: { name: 'asc' },
    });

    return mealTypes.map((mt) => ({
      id: mt.id,
      mess_id: mt.mess_id,
      name: mt.name,
      value: Number(mt.value),
      is_active: mt.is_active,
      created_at: mt.created_at.toISOString(),
      updated_at: mt.updated_at.toISOString(),
    }));
  }

  async updateMess(
    messId: string,
    actorId: string,
    data: UpdateMessDto,
  ): Promise<MessWithMembership> {
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
        message: 'Only managers can update mess details',
        code: ErrorCode.MANAGER_ONLY,
      });
    }

    const mess = await prisma.messes.findFirst({
      where: { id: messId, deleted_at: null },
    });

    if (!mess) {
      throw new NotFoundException({
        message: 'Mess not found',
        code: ErrorCode.MESS_NOT_FOUND,
      });
    }

    if (data.slug && data.slug !== mess.slug) {
      const existingSlug = await prisma.messes.findFirst({
        where: { slug: data.slug, deleted_at: null, id: { not: messId } },
      });

      if (existingSlug) {
        throw new BadRequestException({
          message:
            'A mess with this slug already exists. Please choose a different slug.',
          code: ErrorCode.SLUG_TAKEN,
        });
      }
    }

    const updated = await prisma.messes.update({
      where: { id: messId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.slug !== undefined && { slug: data.slug }),
        updated_at: new Date(),
      },
    });

    this.logger.log(`✅ Mess updated: ${messId} by ${actorId}`);

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description ?? undefined,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
      current_user_role: 'MANAGER',
      member_id: membership.id,
    };
  }

  async updateMealType(
    messId: string,
    mealTypeId: string,
    actorId: string,
    data: UpdateMealTypeDto,
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
        message: 'Only managers can update meal types',
        code: ErrorCode.MANAGER_ONLY,
      });
    }

    const mealType = await prisma.meal_types.findFirst({
      where: {
        id: mealTypeId,
        mess_id: messId,
        deleted_at: null,
      },
    });

    if (!mealType) {
      throw new NotFoundException({
        message: 'Meal type not found',
        code: ErrorCode.MEAL_TYPE_NOT_FOUND,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.meal_types.update({
        where: { id: mealTypeId },
        data: {
          ...(data.value !== undefined && { value: data.value }),
          ...(data.is_active !== undefined && { is_active: data.is_active }),
          updated_at: new Date(),
        },
      });
      // The value is the default daily count, so changing it (or switching
      // a type on/off) changes the default meals.
      await tx.activity_logs.create({
        data: {
          mess_id: messId,
          actor_id: actorId,
          action: 'DEFAULT_MEALS_UPDATED',
          entity_type: 'meal_types',
          entity_id: mealTypeId,
        },
      });
      return row;
    });

    this.logger.log(`✅ Meal type updated: ${mealTypeId} by ${actorId}`);

    return {
      id: updated.id,
      mess_id: updated.mess_id,
      name: updated.name,
      value: Number(updated.value),
      is_active: updated.is_active,
      created_at: updated.created_at.toISOString(),
      updated_at: updated.updated_at.toISOString(),
    };
  }

  async createMealType(
    messId: string,
    actorId: string,
    data: CreateMealTypeDto,
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
        message: 'Only managers can create meal types',
        code: ErrorCode.MANAGER_ONLY,
      });
    }

    const existingCount = await prisma.meal_types.count({
      where: {
        mess_id: messId,
        deleted_at: null,
      },
    });

    if (existingCount >= 10) {
      throw new BadRequestException({
        message: 'Maximum 10 meal types allowed per mess',
        code: ErrorCode.MEAL_TYPE_LIMIT_REACHED,
      });
    }

    try {
      const created = await prisma.$transaction(async (tx) => {
        const row = await tx.meal_types.create({
          data: {
            mess_id: messId,
            name: data.name,
            value: data.value,
          },
        });
        await tx.activity_logs.create({
          data: {
            mess_id: messId,
            actor_id: actorId,
            action: 'DEFAULT_MEALS_UPDATED',
            entity_type: 'meal_types',
            entity_id: row.id,
          },
        });
        return row;
      });

      this.logger.log(
        `✅ Meal type created: ${created.id} (${created.name}) by ${actorId}`,
      );

      return {
        id: created.id,
        mess_id: created.mess_id,
        name: created.name,
        value: Number(created.value),
        is_active: created.is_active,
        created_at: created.created_at.toISOString(),
        updated_at: created.updated_at.toISOString(),
      };
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException({
            message: 'A meal type with this name already exists',
            code: ErrorCode.MEAL_TYPE_NAME_TAKEN,
          });
        }
      }
      throw error;
    }
  }

  async deleteMealType(
    messId: string,
    mealTypeId: string,
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
        message: 'Only managers can delete meal types',
        code: ErrorCode.MANAGER_ONLY,
      });
    }

    const mealType = await prisma.meal_types.findFirst({
      where: {
        id: mealTypeId,
        mess_id: messId,
        deleted_at: null,
      },
    });

    if (!mealType) {
      throw new NotFoundException({
        message: 'Meal type not found',
        code: ErrorCode.MEAL_TYPE_NOT_FOUND,
      });
    }

    await prisma.$transaction([
      prisma.meal_types.update({
        where: { id: mealTypeId },
        data: { deleted_at: new Date() },
      }),
      prisma.activity_logs.create({
        data: {
          mess_id: messId,
          actor_id: actorId,
          action: 'DEFAULT_MEALS_UPDATED',
          entity_type: 'meal_types',
          entity_id: mealTypeId,
        },
      }),
    ]);

    this.logger.log(`✅ Meal type deleted: ${mealTypeId} by ${actorId}`);

    return { success: true };
  }
}
