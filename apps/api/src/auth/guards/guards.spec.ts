jest.mock(
  '@repo/database',
  () => jest.requireActual('../../../test/prisma-mock').databaseModule,
);

import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@repo/shared';
import { prismaMock, resetPrismaMock } from '../../../test/prisma-mock';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MembershipGuard } from './membership.guard';
import { RolesGuard } from './roles.guard';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLES_KEY } from './roles.decorator';

const MESS = '11111111-1111-4111-8111-111111111111';

function context(
  request: { user?: { id: string }; params?: Record<string, string> },
  metadata: Record<string, unknown> = {},
): ExecutionContext {
  const handler = () => undefined;
  for (const [key, value] of Object.entries(metadata)) {
    Reflect.defineMetadata(key, value, handler);
  }
  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({ params: {}, ...request }),
    }),
  } as unknown as ExecutionContext;
}

async function forbidden(p: Promise<unknown>, code?: ErrorCode) {
  const err: unknown = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ForbiddenException);
  if (code) {
    expect((err as ForbiddenException).getResponse()).toMatchObject({ code });
  }
}

beforeEach(resetPrismaMock);

describe('MembershipGuard', () => {
  const guard = new MembershipGuard();

  it('rejects a request without a user', async () => {
    await forbidden(guard.canActivate(context({ params: { messId: MESS } })));
    expect(prismaMock.mess_members.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a route without :messId', async () => {
    await forbidden(guard.canActivate(context({ user: { id: 'u1' } })));
  });

  it('rejects a user who is not an active member of that mess', async () => {
    prismaMock.mess_members.findFirst.mockResolvedValue(null);
    await forbidden(
      guard.canActivate(
        context({ user: { id: 'u1' }, params: { messId: MESS } }),
      ),
      ErrorCode.NOT_MESS_MEMBER,
    );
  });

  it('checks the mess in the URL and ignores removed or deleted memberships', async () => {
    prismaMock.mess_members.findFirst.mockResolvedValue({ id: 'm1' });
    await expect(
      guard.canActivate(
        context({ user: { id: 'u1' }, params: { messId: MESS } }),
      ),
    ).resolves.toBe(true);
    expect(prismaMock.mess_members.findFirst).toHaveBeenCalledWith({
      where: {
        user_id: 'u1',
        mess_id: MESS,
        removed_at: null,
        deleted_at: null,
      },
    });
  });
});

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());
  const managerRoute = { [ROLES_KEY]: ['MANAGER'] };

  it('lets routes without @Roles through without a DB lookup', async () => {
    await expect(guard.canActivate(context({}))).resolves.toBe(true);
    expect(prismaMock.mess_members.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a request without a user', async () => {
    await forbidden(
      guard.canActivate(context({ params: { messId: MESS } }, managerRoute)),
    );
  });

  it('rejects a route without :messId', async () => {
    await forbidden(
      guard.canActivate(context({ user: { id: 'u1' } }, managerRoute)),
    );
  });

  it('rejects a non-member', async () => {
    prismaMock.mess_members.findFirst.mockResolvedValue(null);
    await forbidden(
      guard.canActivate(
        context({ user: { id: 'u1' }, params: { messId: MESS } }, managerRoute),
      ),
      ErrorCode.NOT_MESS_MEMBER,
    );
  });

  it('rejects a plain member on a manager-only route', async () => {
    prismaMock.mess_members.findFirst.mockResolvedValue({
      mess_role: 'MEMBER',
    });
    await forbidden(
      guard.canActivate(
        context({ user: { id: 'u1' }, params: { messId: MESS } }, managerRoute),
      ),
      ErrorCode.MANAGER_ONLY,
    );
  });

  it('allows a manager of that mess', async () => {
    prismaMock.mess_members.findFirst.mockResolvedValue({
      mess_role: 'MANAGER',
    });
    await expect(
      guard.canActivate(
        context({ user: { id: 'u1' }, params: { messId: MESS } }, managerRoute),
      ),
    ).resolves.toBe(true);
    expect(prismaMock.mess_members.findFirst).toHaveBeenCalledWith({
      where: {
        user_id: 'u1',
        mess_id: MESS,
        removed_at: null,
        deleted_at: null,
      },
    });
  });
});

describe('JwtAuthGuard', () => {
  it('skips authentication on @Public() routes', () => {
    const guard = new JwtAuthGuard(new Reflector());
    expect(guard.canActivate(context({}, { [IS_PUBLIC_KEY]: true }))).toBe(
      true,
    );
  });
});
