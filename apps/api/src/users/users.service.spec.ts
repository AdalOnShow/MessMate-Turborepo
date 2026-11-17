jest.mock(
  '@repo/database',
  () => jest.requireActual('../../test/prisma-mock').databaseModule,
);

import {
  BadRequestException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { ErrorCode } from '@repo/shared';
import { prismaMock, resetPrismaMock } from '../../test/prisma-mock';
import type { CloudinaryService } from '../common/services/cloudinary.service';
import { UsersService } from './users.service';

const MESS = 'mess-1';
const MANAGER = 'manager-user';

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

describe('UsersService', () => {
  const service = new UsersService(
    new ConfigService({ BCRYPT_SALT_ROUNDS: '4' }),
    {} as CloudinaryService,
  );

  beforeEach(resetPrismaMock);

  describe('createMemberAccount (manager creates a login for someone)', () => {
    const input = {
      name: '  Arif Hossain ',
      email: '  Arif@Example.COM ',
      password: 'temp-pass-123',
      phone: ' 01711000004 ',
      messId: MESS,
    };

    it('rejects a non-member of the target mess', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.createMemberAccount(input, MANAGER),
        ForbiddenException,
        ErrorCode.MANAGER_ONLY,
      );
      expect(prismaMock.users.create).not.toHaveBeenCalled();
    });

    it('rejects a plain member', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({
        mess_role: 'MEMBER',
      });
      await rejectsWith(
        service.createMemberAccount(input, MANAGER),
        ForbiddenException,
        ErrorCode.MANAGER_ONLY,
      );
    });

    it('checks the manager role in the mess named in the request', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await service.createMemberAccount(input, MANAGER).catch(() => undefined);
      expect(prismaMock.mess_members.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            mess_id: MESS,
            user_id: MANAGER,
            removed_at: null,
            deleted_at: null,
          },
        }),
      );
    });

    it('rejects an email that already has an account', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({
        mess_role: 'MANAGER',
      });
      prismaMock.users.findFirst.mockResolvedValue({ id: 'existing' });
      await rejectsWith(
        service.createMemberAccount(input, MANAGER),
        BadRequestException,
        ErrorCode.EMAIL_IN_USE,
      );
      expect(prismaMock.users.findFirst).toHaveBeenCalledWith({
        where: { email: 'arif@example.com', deleted_at: null },
      });
    });

    it('creates the user (hashed password, trimmed + lowercased) and adds them as MEMBER', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({
        mess_role: 'MANAGER',
      });
      prismaMock.users.findFirst.mockResolvedValue(null);
      prismaMock.users.create.mockResolvedValue({ id: 'new-user' });
      prismaMock.mess_members.create.mockResolvedValue({ id: 'new-member' });

      await service.createMemberAccount(input, MANAGER);

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      const { data } = prismaMock.users.create.mock.calls[0][0] as {
        data: Record<string, unknown> & { password: string };
      };
      expect(data).toMatchObject({
        name: 'Arif Hossain',
        email: 'arif@example.com',
        phone: '01711000004',
        manager_created: true,
        email_verified: false,
      });
      expect(data.password).not.toBe(input.password);
      await expect(bcrypt.compare(input.password, data.password)).resolves.toBe(
        true,
      );
      expect(prismaMock.mess_members.create).toHaveBeenCalledWith({
        data: { mess_id: MESS, user_id: 'new-user', mess_role: 'MEMBER' },
      });
    });

    it("logs the new membership's id", async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({
        mess_role: 'MANAGER',
      });
      prismaMock.users.findFirst.mockResolvedValue(null);
      prismaMock.users.create.mockResolvedValue({ id: 'new-user' });
      prismaMock.mess_members.create.mockResolvedValue({ id: 'new-member' });

      await service.createMemberAccount(input, MANAGER);

      expect(prismaMock.activity_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entity_type: 'mess_members',
          entity_id: 'new-member',
        }),
      });
    });
  });

  describe('searchUsers (find people to invite)', () => {
    it('needs at least 3 characters and does not hit the DB otherwise', async () => {
      await expect(service.searchUsers(MANAGER, ' ab ')).resolves.toEqual([]);
      expect(prismaMock.users.findMany).not.toHaveBeenCalled();
    });

    it('is manager-only', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue(null);
      await rejectsWith(
        service.searchUsers('member-user', 'arif'),
        ForbiddenException,
        ErrorCode.MANAGER_ONLY,
      );
    });

    it('masks emails unless the query is the exact email, and excludes the caller', async () => {
      prismaMock.mess_members.findFirst.mockResolvedValue({ id: 'm' });
      prismaMock.users.findMany.mockResolvedValue([
        { id: 'a', name: 'Arif', email: 'arif@example.com' },
        { id: 'b', name: 'Arif 2', email: 'arif2@example.com' },
      ]);

      const result = await service.searchUsers(MANAGER, 'ARIF@example.com');

      expect(result.map((u) => u.email)).toEqual([
        'arif@example.com',
        'ar****@example.com',
      ]);
      const { where, take } = prismaMock.users.findMany.mock.calls[0][0] as {
        where: Record<string, unknown>;
        take: number;
      };
      expect(where).toMatchObject({ deleted_at: null, id: { not: MANAGER } });
      expect(take).toBeLessThanOrEqual(10);
    });
  });

  describe('changePassword', () => {
    it.each([
      ['too short', 'Ab1'],
      ['no uppercase letter', 'new-password-1'],
      ['no lowercase letter', 'NEW-PASSWORD-1'],
      ['no number', 'New-password'],
    ])('rejects a weak new password (%s)', async (_label, weak) => {
      const err: unknown = await service
        .changePassword('u1', 'Old-password-1', weak)
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(BadRequestException);
      expect((err as HttpException).getResponse()).toMatchObject({
        details: { newPassword: expect.any(String) },
      });
      expect(prismaMock.users.update).not.toHaveBeenCalled();
    });

    it('rejects a new password equal to the current one', async () => {
      const err: unknown = await service
        .changePassword('u1', 'Same-password-1', 'Same-password-1')
        .catch((e: unknown) => e);
      expect((err as HttpException).getResponse()).toMatchObject({
        details: {
          newPassword:
            'New password must be different from your current password',
        },
      });
    });

    it('rejects a wrong current password', async () => {
      prismaMock.users.findUnique.mockResolvedValue({
        id: 'u1',
        password: await bcrypt.hash('old-password-1', 4),
      });
      await rejectsWith(
        service.changePassword('u1', 'not-it-at-all', 'New-password-1'),
        BadRequestException,
        ErrorCode.CURRENT_PASSWORD_INCORRECT,
      );
      expect(prismaMock.users.update).not.toHaveBeenCalled();
    });

    it('signs out every other session but keeps this one', async () => {
      prismaMock.users.findUnique.mockResolvedValue({
        id: 'u1',
        password: await bcrypt.hash('old-password-1', 4),
      });

      await service.changePassword(
        'u1',
        'old-password-1',
        'New-password-1',
        'this-session',
      );

      expect(prismaMock.user_sessions.updateMany).toHaveBeenCalledWith({
        where: {
          user_id: 'u1',
          revoked_at: null,
          id: { not: 'this-session' },
        },
        data: { revoked_at: expect.any(Date) },
      });
    });
  });
});
