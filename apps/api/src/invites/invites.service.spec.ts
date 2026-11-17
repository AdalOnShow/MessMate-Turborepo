jest.mock(
  '@repo/database',
  () => jest.requireActual('../../test/prisma-mock').databaseModule,
);

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '@repo/shared';
import { prismaMock, resetPrismaMock } from '../../test/prisma-mock';
import { InvitesService } from './invites.service';

const MESS = 'mess-1';
const MANAGER = 'manager-user';
const TARGET = 'target-user';

async function rejectsWith(
  p: Promise<unknown>,
  type: new (...args: never[]) => HttpException,
  code?: ErrorCode,
) {
  const err: unknown = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(type);
  if (code) {
    expect((err as HttpException).getResponse()).toMatchObject({ code });
  }
}

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

describe('InvitesService', () => {
  const service = new InvitesService();

  beforeEach(resetPrismaMock);

  describe('inviteUserForActor (who may invite)', () => {
    it('rejects a user with no active mess', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.inviteUserForActor(MANAGER, { email: 'x@y.z' }),
        ForbiddenException,
        ErrorCode.NO_ACTIVE_MESS,
      );
    });

    it('rejects a plain member', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({
        mess_id: MESS,
        mess_role: 'MEMBER',
      });
      await rejectsWith(
        service.inviteUserForActor('member-user', { email: 'x@y.z' }),
        ForbiddenException,
        ErrorCode.MANAGER_ONLY,
      );
      expect(prismaMock.join_requests.create).not.toHaveBeenCalled();
    });

    it("only looks at the actor's active membership", async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await service
        .inviteUserForActor(MANAGER, { email: 'x@y.z' })
        .catch(() => undefined);
      expect(prismaMock.mess_members.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: MANAGER, removed_at: null, deleted_at: null },
        }),
      );
    });

    it("invites into the manager's own mess", async () => {
      prismaMock.mess_members.findFirst
        .mockResolvedValueOnce({ mess_id: MESS, mess_role: 'MANAGER' }) // actor
        .mockResolvedValueOnce(null); // target not a member
      prismaMock.users.findFirst.mockResolvedValue({
        id: TARGET,
        name: 'T',
        email: 't@x.com',
      });
      prismaMock.join_requests.findFirst.mockResolvedValue(null);
      prismaMock.join_requests.create.mockResolvedValue({
        id: 'inv-1',
        mess_id: MESS,
        requested_by: MANAGER,
        created_at: new Date(),
        mess: { name: 'Green Villa' },
        requester: { name: 'Manager', email: 'm@x.com' },
      });

      await service.inviteUserForActor(MANAGER, { userId: TARGET });

      expect(prismaMock.join_requests.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            mess_id: MESS,
            user_id: TARGET,
            requested_by: MANAGER,
            status: 'PENDING',
          },
        }),
      );
    });
  });

  describe('inviteUser', () => {
    const invitedRow = {
      id: 'inv-1',
      mess_id: MESS,
      requested_by: MANAGER,
      created_at: new Date('2026-11-17T10:00:00Z'),
      mess: { name: 'Green Villa' },
      requester: { name: 'Manager', email: 'm@x.com' },
    };

    function targetExists() {
      prismaMock.users.findFirst.mockResolvedValue({
        id: TARGET,
        name: 'T',
        email: 't@x.com',
      });
    }

    it('returns 404 when nobody has that email', async () => {
      prismaMock.users.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.inviteUser(MESS, MANAGER, { email: 'nobody@x.com' }),
        NotFoundException,
      );
    });

    it('normalises the email and skips deleted users', async () => {
      prismaMock.users.findFirst.mockResolvedValue(null);
      await service
        .inviteUser(MESS, MANAGER, { email: '  Someone@Example.COM ' })
        .catch(() => undefined);
      expect(prismaMock.users.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'someone@example.com', deleted_at: null },
        }),
      );
    });

    it('rejects an active member', async () => {
      targetExists();
      prismaMock.mess_members.findFirst.mockResolvedValue({
        removed_at: null,
      });
      await rejectsWith(
        service.inviteUser(MESS, MANAGER, { userId: TARGET }),
        ConflictException,
        ErrorCode.ALREADY_MEMBER,
      );
    });

    it('rejects a member who was removed earlier', async () => {
      targetExists();
      prismaMock.mess_members.findFirst.mockResolvedValue({
        removed_at: new Date(),
      });
      await rejectsWith(
        service.inviteUser(MESS, MANAGER, { userId: TARGET }),
        ConflictException,
        ErrorCode.MEMBER_PREVIOUSLY_REMOVED,
      );
    });

    it('rejects a second pending invite', async () => {
      targetExists();
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      prismaMock.join_requests.findFirst.mockResolvedValue({ id: 'old' });
      await rejectsWith(
        service.inviteUser(MESS, MANAGER, { userId: TARGET }),
        ConflictException,
        ErrorCode.INVITE_ALREADY_PENDING,
      );
      expect(prismaMock.join_requests.create).not.toHaveBeenCalled();
    });

    it('creates a pending invite, logs it, and returns it', async () => {
      targetExists();
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      prismaMock.join_requests.findFirst.mockResolvedValue(null);
      prismaMock.join_requests.create.mockResolvedValue(invitedRow);

      const result = await service.inviteUser(MESS, MANAGER, {
        userId: TARGET,
      });

      expect(result).toEqual({
        id: 'inv-1',
        mess_id: MESS,
        mess_name: 'Green Villa',
        requested_by: MANAGER,
        requester_name: 'Manager',
        requester_email: 'm@x.com',
        created_at: '2026-11-17T10:00:00.000Z',
      });
      expect(prismaMock.activity_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mess_id: MESS,
          actor_id: MANAGER,
          entity_type: 'join_requests',
          entity_id: 'inv-1',
        }),
      });
    });
  });

  describe('acceptInvite', () => {
    const pending = (over: Record<string, unknown> = {}) => ({
      id: 'inv-1',
      mess_id: MESS,
      user_id: TARGET,
      requested_by: MANAGER,
      status: 'PENDING',
      created_at: daysAgo(1),
      ...over,
    });

    /** Membership lookups: [this mess, any active mess]. */
    function memberships(thisMess: unknown, anyMess: unknown) {
      prismaMock.mess_members.findFirst
        .mockResolvedValueOnce(thisMess)
        .mockResolvedValueOnce(anyMess);
    }

    function cutoffDays(where: { created_at: { gte: Date } }) {
      return (Date.now() - where.created_at.gte.getTime()) / 86_400_000;
    }

    it("only finds the caller's own, pending, unexpired invite", async () => {
      prismaMock.join_requests.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.acceptInvite('inv-1', 'someone-else'),
        BadRequestException,
      );
      const { where } = prismaMock.join_requests.findFirst.mock.calls[0][0];
      expect(where).toMatchObject({
        id: 'inv-1',
        user_id: 'someone-else',
        status: 'PENDING',
      });
      expect(cutoffDays(where)).toBeCloseTo(7, 1);
      expect(prismaMock.mess_members.create).not.toHaveBeenCalled();
    });

    it('rejects an invite older than 7 days', async () => {
      // The DB filter excludes it, so nothing is found.
      prismaMock.join_requests.findFirst.mockImplementation(
        ({ where }: { where: { created_at: { gte: Date } } }) => {
          const invite = pending({ created_at: daysAgo(30) });
          return invite.created_at >= where.created_at.gte ? invite : null;
        },
      );
      await rejectsWith(
        service.acceptInvite('inv-1', TARGET),
        BadRequestException,
      );
      expect(prismaMock.mess_members.create).not.toHaveBeenCalled();
    });

    it('rejects when the user is already in this mess', async () => {
      prismaMock.join_requests.findFirst.mockResolvedValue(pending());
      memberships({ id: 'm1' }, { id: 'm1' });
      await rejectsWith(
        service.acceptInvite('inv-1', TARGET),
        ConflictException,
        ErrorCode.ALREADY_MEMBER,
      );
    });

    it('rejects with a clear error when the user is in another mess (ADR-003)', async () => {
      prismaMock.join_requests.findFirst.mockResolvedValue(pending());
      memberships(null, { id: 'other' });

      await rejectsWith(
        service.acceptInvite('inv-1', TARGET),
        ConflictException,
        ErrorCode.ALREADY_IN_MESS,
      );
      expect(prismaMock.mess_members.findFirst).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { user_id: TARGET, removed_at: null, deleted_at: null },
        }),
      );
      expect(prismaMock.mess_members.create).not.toHaveBeenCalled();
    });

    it('a second accept (double click) loses the claim and adds nothing', async () => {
      prismaMock.join_requests.findFirst.mockResolvedValue(pending());
      memberships(null, null);
      prismaMock.join_requests.updateMany.mockResolvedValue({ count: 0 });

      await rejectsWith(
        service.acceptInvite('inv-1', TARGET),
        BadRequestException,
      );
      expect(prismaMock.mess_members.create).not.toHaveBeenCalled();
    });

    it('claims the invite, then adds the user as a MEMBER, in one transaction', async () => {
      prismaMock.join_requests.findFirst.mockResolvedValue(pending());
      memberships(null, null);
      prismaMock.join_requests.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.mess_members.create.mockResolvedValue({ id: 'new-member' });

      await expect(service.acceptInvite('inv-1', TARGET)).resolves.toEqual({
        success: true,
      });

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      const claim = prismaMock.join_requests.updateMany.mock.calls[0][0];
      expect(claim.where).toMatchObject({
        id: 'inv-1',
        user_id: TARGET,
        status: 'PENDING',
      });
      expect(cutoffDays(claim.where)).toBeCloseTo(7, 1);
      expect(claim.data).toEqual({
        status: 'ACCEPTED',
        verified_at: expect.any(Date),
      });
      expect(
        prismaMock.join_requests.updateMany.mock.invocationCallOrder[0],
      ).toBeLessThan(
        prismaMock.mess_members.create.mock.invocationCallOrder[0],
      );
      expect(prismaMock.mess_members.create).toHaveBeenCalledWith({
        data: { mess_id: MESS, user_id: TARGET, mess_role: 'MEMBER' },
      });
      expect(prismaMock.activity_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'MEMBER_ADDED',
          entity_id: 'new-member',
        }),
      });
    });
  });

  describe('rejectInvite', () => {
    it("only touches the caller's own pending invite", async () => {
      prismaMock.join_requests.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.rejectInvite('inv-1', 'someone-else'),
        BadRequestException,
      );
      expect(prismaMock.join_requests.update).not.toHaveBeenCalled();
    });

    it('marks it rejected', async () => {
      prismaMock.join_requests.findFirst.mockResolvedValue({ id: 'inv-1' });
      await service.rejectInvite('inv-1', TARGET);
      expect(prismaMock.join_requests.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: 'REJECTED', verified_at: expect.any(Date) },
      });
    });
  });

  describe('getPendingInvites', () => {
    it("expires the caller's week-old invites before listing", async () => {
      prismaMock.join_requests.updateMany.mockResolvedValue({ count: 1 });
      prismaMock.join_requests.findMany.mockResolvedValue([]);

      await service.getPendingInvites(TARGET);

      const { where, data } = prismaMock.join_requests.updateMany.mock
        .calls[0][0] as {
        where: { user_id: string; created_at: { lt: Date } };
        data: unknown;
      };
      expect(where.user_id).toBe(TARGET);
      expect(data).toEqual({ status: 'EXPIRED' });
      const cutoffDays =
        (Date.now() - where.created_at.lt.getTime()) / 86_400_000;
      expect(cutoffDays).toBeCloseTo(7, 1);
      expect(
        prismaMock.join_requests.updateMany.mock.invocationCallOrder[0],
      ).toBeLessThan(
        prismaMock.join_requests.findMany.mock.invocationCallOrder[0],
      );
    });
  });
});
