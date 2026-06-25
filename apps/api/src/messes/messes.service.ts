import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@repo/database';
import { type CreateMessDto } from '@repo/shared';
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
    } catch (error) {
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

    if (member.mess_role === 'MANAGER') {
      const managerCount = await prisma.mess_members.count({
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

    await prisma.mess_members.update({
      where: { id: member.id },
      data: { removed_at: new Date() },
    });

    await prisma.activity_logs.create({
      data: {
        mess_id: messId,
        actor_id: actorId,
        action: 'MEMBER_REMOVED',
        entity_type: 'mess_members',
        entity_id: member.id,
      },
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
}
