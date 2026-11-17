jest.mock(
  '@repo/database',
  () => jest.requireActual('../../../test/prisma-mock').databaseModule,
);

import { ConfigService } from '@nestjs/config';
import type { AuthService } from '../auth.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy.validate', () => {
  const findUserById = jest.fn();
  const strategy = new JwtStrategy(
    { findUserById } as unknown as AuthService,
    new ConfigService({ JWT_ACCESS_SECRET: 'secret' }),
  );

  beforeEach(() => findUserById.mockReset());

  it('rejects a token without a subject', async () => {
    await expect(strategy.validate({ email: 'a@b.c' })).resolves.toBeNull();
    expect(findUserById).not.toHaveBeenCalled();
  });

  it('rejects a token for a missing or deleted user', async () => {
    findUserById.mockResolvedValue(null);
    await expect(strategy.validate({ sub: 'u1' })).resolves.toBeNull();
  });

  it('attaches the user and the session id', async () => {
    findUserById.mockResolvedValue({
      id: 'u1',
      email: 'a@b.c',
      name: 'A',
      system_role: 'USER',
    });
    await expect(
      strategy.validate({ sub: 'u1', sid: 's1' }),
    ).resolves.toMatchObject({ id: 'u1', sessionId: 's1' });
  });
});
