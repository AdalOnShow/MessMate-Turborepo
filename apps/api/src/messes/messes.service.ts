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
} from '@repo/shared';
import type { MemberFilters, MessMemberWithUser } from '@repo/shared';

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

    let slug = `${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}`;
    if (!slug) {
      slug = `mess-${Date.now().toString(36)}`;
    }

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
          throw new BadRequestException(
            'A mess with this name already exists. Please choose a different name.',
          );
        }
      }
      throw error;
    }
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

  async addMember(
    messId: string,
    actorId: string,
    userId: string,
  ): Promise<MessMemberWithUser> {
    const existing = await prisma.mess_members.findFirst({
      where: { mess_id: messId, user_id: userId, deleted_at: null },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this mess');
    }

    const member = await prisma.mess_members.create({
      data: {
        mess_id: messId,
        user_id: userId,
        mess_role: 'MEMBER',
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

    await prisma.activity_logs.create({
      data: {
        mess_id: messId,
        actor_id: actorId,
        action: 'MEMBER_ADDED',
        entity_type: 'mess_members',
        entity_id: member.id,
      },
    });

    this.logger.log(`✅ Member added: ${userId} to mess ${messId}`);

    return {
      id: member.id,
      mess_id: member.mess_id,
      user_id: member.user_id,
      mess_role: member.mess_role as 'MANAGER' | 'MEMBER',
      joined_at: member.joined_at.toISOString(),
      removed_at: null,
      user: member.user,
    };
  }

  async removeMember(
    messId: string,
    actorId: string,
    userId: string,
  ): Promise<{ success: true }> {
    if (actorId === userId) {
      throw new BadRequestException('You cannot remove yourself from the mess');
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
        throw new NotFoundException('Member not found');
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
          throw new BadRequestException('Cannot remove the last manager');
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
      throw new NotFoundException('Member not found');
    }

    if (newRole === 'MANAGER') {
      const managerCount = await prisma.mess_members.count({
        where: {
          mess_id: messId,
          mess_role: 'MANAGER',
          removed_at: null,
          deleted_at: null,
        },
      });

      if (managerCount >= 2) {
        throw new BadRequestException('Maximum 2 managers allowed per mess');
      }
    }

    const updated = await prisma.mess_members.update({
      where: { id: member.id },
      data: { mess_role: newRole },
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

    await prisma.activity_logs.create({
      data: {
        mess_id: messId,
        actor_id: actorId,
        action: newRole === 'MANAGER' ? 'MANAGER_ASSIGNED' : 'MEMBER_REMOVED',
        entity_type: 'mess_members',
        entity_id: updated.id,
      },
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
      throw new ForbiddenException('Only managers can update mess details');
    }

    const mess = await prisma.messes.findFirst({
      where: { id: messId, deleted_at: null },
    });

    if (!mess) {
      throw new NotFoundException('Mess not found');
    }

    if (data.slug && data.slug !== mess.slug) {
      const existingSlug = await prisma.messes.findFirst({
        where: { slug: data.slug, deleted_at: null, id: { not: messId } },
      });

      if (existingSlug) {
        throw new BadRequestException(
          'A mess with this slug already exists. Please choose a different slug.',
        );
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
      throw new ForbiddenException('Only managers can update meal types');
    }

    const mealType = await prisma.meal_types.findFirst({
      where: {
        id: mealTypeId,
        mess_id: messId,
        deleted_at: null,
      },
    });

    if (!mealType) {
      throw new NotFoundException('Meal type not found');
    }

    const updated = await prisma.meal_types.update({
      where: { id: mealTypeId },
      data: {
        ...(data.value !== undefined && { value: data.value }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
        updated_at: new Date(),
      },
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
      throw new ForbiddenException('Only managers can create meal types');
    }

    const existingCount = await prisma.meal_types.count({
      where: {
        mess_id: messId,
        deleted_at: null,
      },
    });

    if (existingCount >= 10) {
      throw new BadRequestException('Maximum 10 meal types allowed per mess');
    }

    try {
      const created = await prisma.meal_types.create({
        data: {
          mess_id: messId,
          name: data.name,
          value: data.value,
        },
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
          throw new ConflictException(
            'A meal type with this name already exists',
          );
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
      throw new ForbiddenException('Only managers can delete meal types');
    }

    const mealType = await prisma.meal_types.findFirst({
      where: {
        id: mealTypeId,
        mess_id: messId,
        deleted_at: null,
      },
    });

    if (!mealType) {
      throw new NotFoundException('Meal type not found');
    }

    await prisma.meal_types.update({
      where: { id: mealTypeId },
      data: { deleted_at: new Date() },
    });

    this.logger.log(`✅ Meal type deleted: ${mealTypeId} by ${actorId}`);

    return { success: true };
  }
}
