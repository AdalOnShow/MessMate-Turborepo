import { ErrorCode } from '@repo/shared';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@repo/database';

type PendingInvite = {
  id: string;
  mess_id: string;
  mess_name: string;
  requested_by: string;
  requester_name: string;
  requester_email: string;
  created_at: string;
};

type InviteTarget = { userId?: string; email?: string };

/** Invites older than this can no longer be accepted. */
export const INVITE_TTL_DAYS = 7;

const inviteCutoff = () =>
  new Date(Date.now() - INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

@Injectable()
export class InvitesService {
  async inviteUserForActor(
    actorId: string,
    target: InviteTarget,
  ): Promise<PendingInvite> {
    const membership = await prisma.mess_members.findFirst({
      where: { user_id: actorId, removed_at: null, deleted_at: null },
      select: { mess_id: true, mess_role: true },
    });

    if (!membership) {
      throw new ForbiddenException({
        message: 'You are not part of any active mess',
        code: ErrorCode.NO_ACTIVE_MESS,
      });
    }

    if (membership.mess_role !== 'MANAGER') {
      throw new ForbiddenException({
        message: 'Only managers can invite members',
        code: ErrorCode.MANAGER_ONLY,
      });
    }

    return this.inviteUser(membership.mess_id, actorId, target);
  }

  async inviteUser(
    messId: string,
    actorId: string,
    target: InviteTarget,
  ): Promise<PendingInvite> {
    const user = await prisma.users.findFirst({
      where: {
        ...(target.userId
          ? { id: target.userId }
          : { email: (target.email ?? '').trim().toLowerCase() }),
        deleted_at: null,
      },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new NotFoundException(
        'User not found. Create an account for this email first.',
      );
    }

    await this.ensureCanInvite(messId, user.id);

    const request = await prisma.join_requests.create({
      data: {
        mess_id: messId,
        user_id: user.id,
        requested_by: actorId,
        status: 'PENDING',
      },
      include: {
        mess: { select: { id: true, name: true, slug: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.activity_logs.create({
      data: {
        mess_id: messId,
        actor_id: actorId,
        action: 'MEMBER_ADDED',
        entity_type: 'join_requests',
        entity_id: request.id,
      },
    });

    return {
      id: request.id,
      mess_id: request.mess_id,
      mess_name: request.mess.name,
      requested_by: request.requested_by,
      requester_name: request.requester.name,
      requester_email: request.requester.email,
      created_at: request.created_at.toISOString(),
    };
  }

  async acceptInvite(
    inviteId: string,
    userId: string,
  ): Promise<{ success: true }> {
    const invite = await prisma.join_requests.findFirst({
      where: {
        id: inviteId,
        user_id: userId,
        status: 'PENDING',
        created_at: { gte: inviteCutoff() },
      },
    });

    if (!invite) {
      throw new BadRequestException(
        'Invite not found, expired or already processed',
      );
    }

    const existingMembership = await prisma.mess_members.findFirst({
      where: {
        mess_id: invite.mess_id,
        user_id: userId,
        deleted_at: null,
      },
    });

    if (existingMembership) {
      throw new ConflictException({
        message: 'You are already a member of this mess',
        code: ErrorCode.ALREADY_MEMBER,
      });
    }

    // ADR-003: one active mess per user.
    const otherMess = await prisma.mess_members.findFirst({
      where: { user_id: userId, removed_at: null, deleted_at: null },
      select: { id: true },
    });

    if (otherMess) {
      throw new ConflictException({
        message:
          'You are already in another mess. Leave it before joining a new one.',
        code: ErrorCode.ALREADY_IN_MESS,
      });
    }

    await prisma.$transaction(async (tx) => {
      // Claim the invite first: a second accept (double click, two tabs)
      // or an invite that expired meanwhile matches nothing.
      const claimed = await tx.join_requests.updateMany({
        where: {
          id: inviteId,
          user_id: userId,
          status: 'PENDING',
          created_at: { gte: inviteCutoff() },
        },
        data: { status: 'ACCEPTED', verified_at: new Date() },
      });

      if (claimed.count === 0) {
        throw new BadRequestException(
          'Invite not found, expired or already processed',
        );
      }

      const member = await tx.mess_members.create({
        data: {
          mess_id: invite.mess_id,
          user_id: userId,
          mess_role: 'MEMBER',
        },
      });

      await tx.activity_logs.create({
        data: {
          mess_id: invite.mess_id,
          actor_id: invite.requested_by,
          action: 'MEMBER_ADDED',
          entity_type: 'mess_members',
          entity_id: member.id,
        },
      });
    });

    return { success: true };
  }

  async rejectInvite(
    inviteId: string,
    userId: string,
  ): Promise<{ success: true }> {
    const invite = await prisma.join_requests.findFirst({
      where: { id: inviteId, user_id: userId, status: 'PENDING' },
    });

    if (!invite) {
      throw new BadRequestException('Invite not found or already processed');
    }

    await prisma.join_requests.update({
      where: { id: inviteId },
      data: { status: 'REJECTED', verified_at: new Date() },
    });

    return { success: true };
  }

  async getPendingInvites(userId: string): Promise<PendingInvite[]> {
    await prisma.join_requests.updateMany({
      where: {
        user_id: userId,
        status: 'PENDING',
        created_at: { lt: inviteCutoff() },
      },
      data: { status: 'EXPIRED' },
    });

    const invites = await prisma.join_requests.findMany({
      where: { user_id: userId, status: 'PENDING' },
      include: {
        mess: { select: { id: true, name: true, slug: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return invites.map((r) => ({
      id: r.id,
      mess_id: r.mess_id,
      mess_name: r.mess.name,
      requested_by: r.requested_by,
      requester_name: r.requester.name,
      requester_email: r.requester.email,
      created_at: r.created_at.toISOString(),
    }));
  }

  async ensureCanInvite(messId: string, targetUserId: string) {
    const membership = await prisma.mess_members.findFirst({
      where: {
        mess_id: messId,
        user_id: targetUserId,
        deleted_at: null,
      },
    });

    if (membership && membership.removed_at === null) {
      throw new ConflictException({
        message: 'User is already an active member of this mess',
        code: ErrorCode.ALREADY_MEMBER,
      });
    }

    if (membership && membership.removed_at !== null) {
      throw new ConflictException({
        message: 'User was previously removed. Ask them to request re-entry.',
        code: ErrorCode.MEMBER_PREVIOUSLY_REMOVED,
      });
    }

    const pending = await prisma.join_requests.findFirst({
      where: {
        mess_id: messId,
        user_id: targetUserId,
        status: 'PENDING',
      },
    });

    if (pending) {
      throw new ConflictException({
        message: 'An invite is already pending for this user',
        code: ErrorCode.INVITE_ALREADY_PENDING,
      });
    }
  }
}
