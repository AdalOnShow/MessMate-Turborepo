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
    function createSucceeds() {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      prismaMock.messes.findMany.mockResolvedValue([]);
      prismaMock.messes.create.mockImplementation(
        ({ data }: { data: { name: string; slug: string } }) => ({
          id: MESS,
          ...data,
          description: null,
          created_at: new Date(),
          updated_at: new Date(),
        }),
      );
      prismaMock.mess_members.create.mockResolvedValue({ id: 'member-1' });
    }

    it('makes the creator the manager and seeds Lunch/Dinner, in one transaction', async () => {
      createSucceeds();

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
      expect(prismaMock.meal_types.createMany).toHaveBeenCalled();
    });

    it('refuses when the user is already in a mess (ADR-003)', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({ id: 'existing' });

      await rejectsWith(
        service.createMess(MANAGER, { name: 'Second Mess' }),
        ConflictException,
        ErrorCode.ALREADY_IN_MESS,
      );
      expect(prismaMock.mess_members.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: MANAGER, removed_at: null, deleted_at: null },
        }),
      );
      expect(prismaMock.messes.create).not.toHaveBeenCalled();
    });

    it('gives a mess with a taken name a numbered slug', async () => {
      createSucceeds();
      prismaMock.messes.findMany.mockResolvedValue([
        { slug: 'green-villa' },
        { slug: 'green-villa-2' },
      ]);

      const mess = await service.createMess(MANAGER, { name: 'Green Villa' });

      expect(mess.slug).toBe('green-villa-3');
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

    it('refuses to demote the last manager', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(
        memberRow({ user_id: MANAGER, mess_role: 'MANAGER' }),
      );
      prismaMock.mess_members.count.mockResolvedValue(1);
      prismaMock.mess_members.update.mockResolvedValue(memberRow());

      await rejectsWith(
        service.updateMemberRole(MESS, MANAGER, MANAGER, 'MEMBER'),
        BadRequestException,
      );
      expect(prismaMock.mess_members.update).not.toHaveBeenCalled();
    });

    it('can demote one of two managers', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(
        memberRow({ mess_role: 'MANAGER' }),
      );
      prismaMock.mess_members.count.mockResolvedValue(2);
      prismaMock.mess_members.update.mockResolvedValue(memberRow());

      const result = await service.updateMemberRole(
        MESS,
        MANAGER,
        TARGET,
        'MEMBER',
      );

      expect(result.mess_role).toBe('MEMBER');
      expect(prismaMock.activity_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'MANAGER_REMOVED' }),
      });
    });

    it('treats a change to the same role as a no-op', async () => {
      // Two managers already: promoting one of them used to hit the limit.
      prismaMock.mess_members.findFirst.mockResolvedValue(
        memberRow({ mess_role: 'MANAGER' }),
      );
      prismaMock.mess_members.count.mockResolvedValue(2);
      prismaMock.mess_members.findUniqueOrThrow.mockResolvedValue(
        memberRow({ mess_role: 'MANAGER' }),
      );

      const result = await service.updateMemberRole(
        MESS,
        MANAGER,
        TARGET,
        'MANAGER',
      );

      expect(result.mess_role).toBe('MANAGER');
      expect(prismaMock.mess_members.update).not.toHaveBeenCalled();
      expect(prismaMock.activity_logs.create).not.toHaveBeenCalled();
    });
  });

  describe('handoverManager', () => {
    const actorRow = memberRow({
      id: 'member-actor',
      user_id: MANAGER,
      mess_role: 'MANAGER',
    });

    it('refuses to hand over to yourself', async () => {
      await rejectsWith(
        service.handoverManager(MESS, MANAGER, MANAGER),
        BadRequestException,
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('returns 404 for someone not active in this mess', async () => {
      prismaMock.mess_members.findFirst
        .mockResolvedValueOnce(actorRow)
        .mockResolvedValueOnce(null);
      await rejectsWith(
        service.handoverManager(MESS, MANAGER, TARGET),
        NotFoundException,
        ErrorCode.MEMBER_NOT_FOUND,
      );
      expect(prismaMock.mess_members.update).not.toHaveBeenCalled();
    });

    it('refuses a target who is already a manager', async () => {
      prismaMock.mess_members.findFirst
        .mockResolvedValueOnce(actorRow)
        .mockResolvedValueOnce(memberRow({ mess_role: 'MANAGER' }));
      await rejectsWith(
        service.handoverManager(MESS, MANAGER, TARGET),
        BadRequestException,
      );
      expect(prismaMock.mess_members.update).not.toHaveBeenCalled();
    });

    it('refuses when the caller is not a manager', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValueOnce(null);
      await rejectsWith(
        service.handoverManager(MESS, MANAGER, TARGET),
        ForbiddenException,
        ErrorCode.MANAGER_ONLY,
      );
      expect(prismaMock.mess_members.update).not.toHaveBeenCalled();
    });

    it('swaps roles and logs both changes, in one transaction', async () => {
      prismaMock.mess_members.findFirst
        .mockResolvedValueOnce(actorRow)
        .mockResolvedValueOnce(memberRow());
      prismaMock.mess_members.update
        .mockResolvedValueOnce(memberRow({ mess_role: 'MANAGER' }))
        .mockResolvedValueOnce({ ...actorRow, mess_role: 'MEMBER' });

      const result = await service.handoverManager(MESS, MANAGER, TARGET);

      expect(result.mess_role).toBe('MANAGER');
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.mess_members.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'member-1' },
          data: { mess_role: 'MANAGER' },
        }),
      );
      expect(prismaMock.mess_members.update).toHaveBeenCalledWith({
        where: { id: 'member-actor' },
        data: { mess_role: 'MEMBER' },
      });
      expect(prismaMock.activity_logs.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            action: 'MANAGER_ASSIGNED',
            entity_id: 'member-1',
          }),
          expect.objectContaining({
            action: 'MANAGER_REMOVED',
            entity_id: 'member-actor',
          }),
        ],
      });
    });
  });
});
