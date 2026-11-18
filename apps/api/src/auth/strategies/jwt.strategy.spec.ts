jest.mock(
  '@repo/database',
  () => jest.requireActual('../../../test/prisma-mock').databaseModule,
);

import { ConfigService } from '@nestjs/config';
import type { AuthService } from '../auth.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy.validate', () => {
  const findUserBySession = jest.fn();
  const strategy = new JwtStrategy(
    { findUserBySession } as unknown as AuthService,
    new ConfigService({ JWT_ACCESS_SECRET: 'secret' }),
  );

  beforeEach(() => findUserBySession.mockReset());

  it('rejects a token without a subject', async () => {
    await expect(strategy.validate({ email: 'a@b.c' })).resolves.toBeNull();
    expect(findUserBySession).not.toHaveBeenCalled();
  });

  it('rejects a token without a session id', async () => {
    await expect(strategy.validate({ sub: 'u1' })).resolves.toBeNull();
    expect(findUserBySession).not.toHaveBeenCalled();
  });

  it('rejects a token whose session was revoked, or a deleted user', async () => {
    findUserBySession.mockResolvedValue(null);
    await expect(
      strategy.validate({ sub: 'u1', sid: 's1' }),
    ).resolves.toBeNull();
    expect(findUserBySession).toHaveBeenCalledWith('u1', 's1');
  });

  it('attaches the user and the session id', async () => {
    findUserBySession.mockResolvedValue({
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
