jest.mock(
  '@repo/database',
  () => jest.requireActual('../../test/prisma-mock').databaseModule,
);

import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { ErrorCode } from '@repo/shared';
import { prismaMock, resetPrismaMock } from '../../test/prisma-mock';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AuthService,
  SESSION_TTL_SECONDS,
} from './auth.service';

const ACCESS_SECRET = 'test-access-secret';
const REFRESH_SECRET = 'test-refresh-secret';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

function makeService() {
  const config = new ConfigService({
    JWT_ACCESS_SECRET: ACCESS_SECRET,
    JWT_REFRESH_SECRET: REFRESH_SECRET,
    BCRYPT_SALT_ROUNDS: '4',
  });
  const jwt = new JwtService({});
  return { service: new AuthService(jwt, config), jwt };
}

const dbUser = (over: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'rakib@example.com',
  name: 'Rakib',
  password: null as string | null,
  system_role: 'USER',
  deleted_at: null as Date | null,
  ...over,
});

async function expectUnauthorized(p: Promise<unknown>, code?: ErrorCode) {
  const err: unknown = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(UnauthorizedException);
  if (code) {
    expect((err as UnauthorizedException).getResponse()).toMatchObject({
      code,
    });
  }
}

describe('AuthService', () => {
  let service: AuthService;
  let jwt: JwtService;

  beforeEach(() => {
    resetPrismaMock();
    ({ service, jwt } = makeService());
    prismaMock.user_sessions.create.mockResolvedValue({});
    prismaMock.user_sessions.update.mockResolvedValue({});
  });

  it('refuses to start without JWT secrets', () => {
    expect(
      () => new AuthService(new JwtService({}), new ConfigService({})),
    ).toThrow();
  });

  describe('validateUser (password sign-in)', () => {
    it('returns the user for the right password, without the hash', async () => {
      const hash = await bcrypt.hash('correct-horse', 4);
      prismaMock.users.findUnique.mockResolvedValue(dbUser({ password: hash }));

      const user = await service.validateUser(
        'rakib@example.com',
        'correct-horse',
      );

      expect(user).toEqual({
        id: 'user-1',
        email: 'rakib@example.com',
        name: 'Rakib',
        system_role: 'USER',
      });
      expect(user).not.toHaveProperty('password');
    });

    it('rejects a wrong password', async () => {
      const hash = await bcrypt.hash('correct-horse', 4);
      prismaMock.users.findUnique.mockResolvedValue(dbUser({ password: hash }));
      await expect(
        service.validateUser('rakib@example.com', 'wrong'),
      ).resolves.toBeNull();
    });

    it('rejects an unknown email', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);
      await expect(
        service.validateUser('nobody@example.com', 'x'),
      ).resolves.toBeNull();
    });

    it('rejects a Google-only account (no password set)', async () => {
      prismaMock.users.findUnique.mockResolvedValue(dbUser({ password: null }));
      await expect(
        service.validateUser('rakib@example.com', ''),
      ).resolves.toBeNull();
    });

    it('rejects a soft-deleted user even with the right password', async () => {
      const hash = await bcrypt.hash('correct-horse', 4);
      prismaMock.users.findUnique.mockResolvedValue(
        dbUser({ password: hash, deleted_at: new Date() }),
      );
      await expect(
        service.validateUser('rakib@example.com', 'correct-horse'),
      ).resolves.toBeNull();
    });

    // BUG: emails are stored exactly as typed at sign-up and looked up
    // case-sensitively, so "Rakib@Example.com" cannot sign in as
    // "rakib@example.com". Invites and manager-created accounts lowercase
    // emails, so they also miss mixed-case sign-ups.
    it.failing('matches the email case-insensitively', async () => {
      const hash = await bcrypt.hash('correct-horse', 4);
      prismaMock.users.findUnique.mockImplementation(
        ({ where }: { where: { email: string } }) =>
          where.email === 'Rakib@Example.com'
            ? dbUser({ email: 'Rakib@Example.com', password: hash })
            : null,
      );
      await expect(
        service.validateUser('rakib@example.com', 'correct-horse'),
      ).resolves.not.toBeNull();
    });
  });

  describe('findUserById (used by the JWT strategy)', () => {
    it('returns null for a missing user', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);
      await expect(service.findUserById('x')).resolves.toBeNull();
    });

    it('returns null for a deleted user', async () => {
      prismaMock.users.findUnique.mockResolvedValue(
        dbUser({ deleted_at: new Date() }),
      );
      await expect(service.findUserById('user-1')).resolves.toBeNull();
    });
  });

  describe('register', () => {
    const signup = {
      name: 'Rakib',
      email: 'rakib@example.com',
      password: 'super-secret-1',
    };

    it('rejects an email that is already registered', async () => {
      prismaMock.users.findUnique.mockResolvedValue(dbUser());
      await expect(service.register(signup)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prismaMock.users.create).not.toHaveBeenCalled();
    });

    it('stores a bcrypt hash, never the plain password', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);
      prismaMock.users.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => ({
          ...dbUser(),
          ...data,
        }),
      );

      await service.register(signup);

      const { data } = prismaMock.users.create.mock.calls[0][0] as {
        data: { password: string };
      };
      expect(data.password).not.toBe(signup.password);
      await expect(
        bcrypt.compare(signup.password, data.password),
      ).resolves.toBe(true);
    });

    it('issues an access token and opens a session storing only the refresh-token hash', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);
      prismaMock.users.create.mockResolvedValue(dbUser());

      const before = Date.now();
      const tokens = await service.register(signup, 'Firefox');

      const access = jwt.verify<{
        sub: string;
        sid: string;
        iat: number;
        exp: number;
      }>(tokens.accessToken, { secret: ACCESS_SECRET });
      expect(access.sub).toBe('user-1');
      expect(access.exp - access.iat).toBe(ACCESS_TOKEN_TTL_SECONDS);

      const { data } = prismaMock.user_sessions.create.mock.calls[0][0] as {
        data: {
          id: string;
          token_hash: string;
          user_agent: string;
          expires_at: Date;
        };
      };
      expect(data.id).toBe(access.sid);
      expect(data.token_hash).toBe(sha256(tokens.refreshToken));
      expect(data.token_hash).not.toBe(tokens.refreshToken);
      expect(data.user_agent).toBe('Firefox');
      expect(data.expires_at.getTime()).toBeGreaterThanOrEqual(
        before + SESSION_TTL_SECONDS * 1000,
      );
    });

    it('signs access and refresh tokens with different secrets', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);
      prismaMock.users.create.mockResolvedValue(dbUser());
      const tokens = await service.register(signup);

      expect(() =>
        jwt.verify(tokens.refreshToken, { secret: ACCESS_SECRET }),
      ).toThrow();
      expect(() =>
        jwt.verify(tokens.accessToken, { secret: REFRESH_SECRET }),
      ).toThrow();
    });
  });

  describe('login', () => {
    it('rejects a user that no longer exists', async () => {
      prismaMock.users.findUnique.mockResolvedValue(null);
      await expectUnauthorized(
        service.login({
          id: 'gone',
          email: 'x@y.z',
          name: 'x',
          system_role: 'USER',
        }),
        ErrorCode.INVALID_CREDENTIALS,
      );
    });

    it('opens a new session per sign-in (one per device)', async () => {
      prismaMock.users.findUnique.mockResolvedValue(dbUser());
      const user = {
        id: 'user-1',
        email: 'rakib@example.com',
        name: 'Rakib',
        system_role: 'USER',
      };
      const a = await service.login(user);
      const b = await service.login(user);

      expect(prismaMock.user_sessions.create).toHaveBeenCalledTimes(2);
      expect(a.refreshToken).not.toBe(b.refreshToken);
      expect(prismaMock.user_sessions.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    async function issue() {
      prismaMock.users.findUnique.mockResolvedValue(dbUser());
      const tokens = await service.login({
        id: 'user-1',
        email: 'rakib@example.com',
        name: 'Rakib',
        system_role: 'USER',
      });
      const { data } = prismaMock.user_sessions.create.mock.calls[0][0] as {
        data: { id: string; token_hash: string };
      };
      return { tokens, session: data };
    }

    it('rejects garbage', async () => {
      await expectUnauthorized(
        service.refreshTokens('not-a-jwt'),
        ErrorCode.SESSION_EXPIRED,
      );
    });

    it('rejects an access token used as a refresh token', async () => {
      const { tokens } = await issue();
      await expectUnauthorized(
        service.refreshTokens(tokens.accessToken),
        ErrorCode.SESSION_EXPIRED,
      );
    });

    it('rejects a token signed with another secret', async () => {
      const forged = await jwt.signAsync(
        { sid: 'session-1' },
        { secret: 'attacker', subject: 'user-1' },
      );
      await expectUnauthorized(service.refreshTokens(forged));
      expect(prismaMock.user_sessions.findFirst).not.toHaveBeenCalled();
    });

    it('only looks up live sessions: not revoked, not expired, same user', async () => {
      const { tokens, session } = await issue();
      prismaMock.user_sessions.findFirst.mockResolvedValue(null);

      await expectUnauthorized(service.refreshTokens(tokens.refreshToken));

      const { where } = prismaMock.user_sessions.findFirst.mock.calls[0][0] as {
        where: Record<string, unknown>;
      };
      expect(where).toMatchObject({
        id: session.id,
        user_id: 'user-1',
        revoked_at: null,
        expires_at: { gt: expect.any(Date) },
      });
    });

    it('rejects when the stored hash does not match the token', async () => {
      const { tokens, session } = await issue();
      prismaMock.user_sessions.findFirst.mockResolvedValue({
        id: session.id,
        token_hash: sha256('some-other-token'),
        user: { id: 'user-1', email: 'rakib@example.com', deleted_at: null },
      });
      await expectUnauthorized(service.refreshTokens(tokens.refreshToken));
    });

    it('rejects a deleted user', async () => {
      const { tokens, session } = await issue();
      prismaMock.user_sessions.findFirst.mockResolvedValue({
        id: session.id,
        token_hash: session.token_hash,
        user: {
          id: 'user-1',
          email: 'rakib@example.com',
          deleted_at: new Date(),
        },
      });
      await expectUnauthorized(service.refreshTokens(tokens.refreshToken));
    });

    it('issues a new access token for the same session and slides its expiry', async () => {
      const { tokens, session } = await issue();
      prismaMock.user_sessions.findFirst.mockResolvedValue({
        id: session.id,
        token_hash: session.token_hash,
        user: { id: 'user-1', email: 'rakib@example.com', deleted_at: null },
      });

      const result = await service.refreshTokens(tokens.refreshToken);

      expect(result.refreshToken).toBe(tokens.refreshToken);
      const payload = jwt.verify<{ sub: string; sid: string }>(
        result.accessToken,
        { secret: ACCESS_SECRET },
      );
      expect(payload).toMatchObject({ sub: 'user-1', sid: session.id });
      expect(prismaMock.user_sessions.update).toHaveBeenCalledWith({
        where: { id: session.id },
        data: expect.objectContaining({ expires_at: expect.any(Date) }),
      });
    });
  });

  describe('logout', () => {
    it('does nothing without a token', async () => {
      await service.logout(undefined);
      expect(prismaMock.user_sessions.updateMany).not.toHaveBeenCalled();
    });

    it('never throws for an invalid token', async () => {
      await expect(service.logout('garbage')).resolves.toBeUndefined();
      expect(prismaMock.user_sessions.updateMany).not.toHaveBeenCalled();
    });

    it("revokes only this token's session", async () => {
      prismaMock.users.findUnique.mockResolvedValue(dbUser());
      const tokens = await service.login({
        id: 'user-1',
        email: 'rakib@example.com',
        name: 'Rakib',
        system_role: 'USER',
      });
      const { data } = prismaMock.user_sessions.create.mock.calls[0][0] as {
        data: { id: string };
      };

      await service.logout(tokens.refreshToken);

      expect(prismaMock.user_sessions.updateMany).toHaveBeenCalledWith({
        where: { id: data.id, user_id: 'user-1', revoked_at: null },
        data: { revoked_at: expect.any(Date) },
      });
    });
  });

  describe('findOrCreateGoogleUser', () => {
    const profile = {
      googleId: 'g-123',
      email: 'rakib@example.com',
      name: 'Rakib',
    };

    it('signs in a user already linked to this Google account', async () => {
      prismaMock.oauth_accounts.findFirst.mockResolvedValue({
        user: dbUser(),
      });
      await expect(service.findOrCreateGoogleUser(profile)).resolves.toEqual(
        expect.objectContaining({ id: 'user-1' }),
      );
      expect(prismaMock.users.create).not.toHaveBeenCalled();
    });

    it('refuses to auto-link Google to an existing password account', async () => {
      prismaMock.oauth_accounts.findFirst.mockResolvedValue(null);
      prismaMock.users.findUnique.mockResolvedValue(dbUser());
      await expectUnauthorized(
        service.findOrCreateGoogleUser(profile),
        ErrorCode.EMAIL_IN_USE,
      );
      expect(prismaMock.users.create).not.toHaveBeenCalled();
    });

    it('creates a verified user linked to Google for a new email', async () => {
      prismaMock.oauth_accounts.findFirst.mockResolvedValue(null);
      prismaMock.users.findUnique.mockResolvedValue(null);
      prismaMock.users.create.mockResolvedValue(dbUser({ id: 'new' }));

      await service.findOrCreateGoogleUser(profile);

      expect(prismaMock.users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email_verified: true,
            oauth_accounts: {
              create: { provider: 'google', provider_user_id: 'g-123' },
            },
          }),
        }),
      );
    });
  });
});
