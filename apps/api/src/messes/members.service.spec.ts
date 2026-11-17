jest.mock(
  '@repo/database',
  () => jest.requireActual('../../test/prisma-mock').databaseModule,
);

import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '@repo/shared';
import { prismaMock, resetPrismaMock } from '../../test/prisma-mock';
import { MessesService } from './messes.service';

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

const memberRow = (over: Record<string, unknown> = {}) => ({
  id: 'member-1',
  mess_id: MESS,
  user_id: TARGET,
  mess_role: 'MEMBER',
  joined_at: new Date('2026-11-01T00:00:00Z'),
  removed_at: null,
  user: { id: TARGET, name: 'T', email: 't@x.com', avatar: null },
  ...over,
});

describe('MessesService – members', () => {
  const service = new MessesService();

  beforeEach(resetPrismaMock);

  describe('createMess', () => {
    it('makes the creator the manager and seeds Lunch/Dinner, in one transaction', async () => {
      prismaMock.messes.create.mockResolvedValue({
        id: MESS,
        name: 'Green Villa',
        slug: 'green-villa',
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
      prismaMock.mess_members.create.mockResolvedValue({ id: 'member-1' });

      const mess = await service.createMess(MANAGER, { name: ' Green Villa ' });

      expect(mess.current_user_role).toBe('MANAGER');
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.mess_members.create).toHaveBeenCalledWith({
        data: { mess_id: MESS, user_id: MANAGER, mess_role: 'MANAGER' },
      });
      expect(prismaMock.messes.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Green Villa',
          slug: 'green-villa',
        }),
      });
    });
  });

  describe('addMember (direct add by a manager)', () => {
    it('rejects someone already in the mess (including removed members)', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(memberRow());
      await rejectsWith(
        service.addMember(MESS, MANAGER, TARGET),
        ConflictException,
        ErrorCode.ALREADY_MEMBER,
      );
      expect(prismaMock.mess_members.findFirst).toHaveBeenCalledWith({
        where: { mess_id: MESS, user_id: TARGET, deleted_at: null },
      });
    });

    it('adds the user as a MEMBER and logs it', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      prismaMock.mess_members.create.mockResolvedValue(memberRow());

      const result = await service.addMember(MESS, MANAGER, TARGET);

      expect(result.mess_role).toBe('MEMBER');
      expect(prismaMock.mess_members.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { mess_id: MESS, user_id: TARGET, mess_role: 'MEMBER' },
        }),
      );
      expect(prismaMock.activity_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'MEMBER_ADDED',
          actor_id: MANAGER,
          entity_id: 'member-1',
        }),
      });
    });
  });

  describe('removeMember', () => {
    it('does not let a manager remove themselves', async () => {
      await rejectsWith(
        service.removeMember(MESS, MANAGER, MANAGER),
        BadRequestException,
      );
      expect(prismaMock.mess_members.update).not.toHaveBeenCalled();
    });

    it('returns 404 for someone not active in this mess', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.removeMember(MESS, MANAGER, TARGET),
        NotFoundException,
      );
    });

    it('refuses to remove the last manager', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(
        memberRow({ mess_role: 'MANAGER' }),
      );
      prismaMock.mess_members.count.mockResolvedValue(1);
      await rejectsWith(
        service.removeMember(MESS, MANAGER, TARGET),
        BadRequestException,
      );
      expect(prismaMock.mess_members.update).not.toHaveBeenCalled();
    });

    it('can remove the other of two managers', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(
        memberRow({ mess_role: 'MANAGER' }),
      );
      prismaMock.mess_members.count.mockResolvedValue(2);
      await expect(
        service.removeMember(MESS, MANAGER, TARGET),
      ).resolves.toEqual({ success: true });
    });

    it('soft-removes (sets removed_at) and logs, in one transaction', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(memberRow());

      await service.removeMember(MESS, MANAGER, TARGET);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.mess_members.update).toHaveBeenCalledWith({
        where: { id: 'member-1' },
        data: { removed_at: expect.any(Date) },
      });
      expect(prismaMock.mess_members.delete).not.toHaveBeenCalled();
      expect(prismaMock.activity_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'MEMBER_REMOVED' }),
      });
    });
  });

  describe('updateMemberRole', () => {
    it('returns 404 for someone not active in this mess', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.updateMemberRole(MESS, MANAGER, TARGET, 'MANAGER'),
        NotFoundException,
      );
    });

    it('enforces at most 2 managers (ADR-004)', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(memberRow());
      prismaMock.mess_members.count.mockResolvedValue(2);
      await rejectsWith(
        service.updateMemberRole(MESS, MANAGER, TARGET, 'MANAGER'),
        BadRequestException,
      );
      expect(prismaMock.mess_members.update).not.toHaveBeenCalled();
    });

    it('promotes a member and logs MANAGER_ASSIGNED', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(memberRow());
      prismaMock.mess_members.count.mockResolvedValue(1);
      prismaMock.mess_members.update.mockResolvedValue(
        memberRow({ mess_role: 'MANAGER' }),
      );

      const result = await service.updateMemberRole(
        MESS,
        MANAGER,
        TARGET,
        'MANAGER',
      );

      expect(result.mess_role).toBe('MANAGER');
      expect(prismaMock.activity_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'MANAGER_ASSIGNED' }),
      });
    });

    // BUG: demoting is never checked against the manager count, so the
    // only manager can demote themselves (or be demoted) and leave the mess
    // with nobody who can manage it. removeMember already guards this case.
    it.failing('refuses to demote the last manager', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(
        memberRow({ user_id: MANAGER, mess_role: 'MANAGER' }),
      );
      prismaMock.mess_members.count.mockResolvedValue(1);
      prismaMock.mess_members.update.mockResolvedValue(memberRow());

      await rejectsWith(
        service.updateMemberRole(MESS, MANAGER, MANAGER, 'MEMBER'),
        BadRequestException,
      );
    });
  });
});
