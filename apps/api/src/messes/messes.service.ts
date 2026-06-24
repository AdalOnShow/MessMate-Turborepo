import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Prisma, prisma } from '@repo/database';
import { type CreateMessDto } from '@repo/shared';

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
}
