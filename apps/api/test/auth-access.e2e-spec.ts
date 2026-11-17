/**
 * HTTP-level authentication and authorization checks.
 *
 * Boots the real auth, users, messes and invites modules (real Passport
 * strategies, real guards, the global exception filter and validation pipe)
 * with Prisma mocked, so nothing touches a database.
 */
jest.mock(
  '@repo/database',
  () => jest.requireActual('./prisma-mock').databaseModule,
);

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ErrorCode } from '@repo/shared';
import { prismaMock, resetPrismaMock } from './prisma-mock';
import { AuthModule } from '../src/auth/auth.module';
import { InvitesModule } from '../src/invites/invites.module';
import { MessesModule } from '../src/messes/messes.module';
import { UsersModule } from '../src/users/users.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';

const ENV = {
  JWT_ACCESS_SECRET: 'e2e-access-secret',
  JWT_REFRESH_SECRET: 'e2e-refresh-secret',
  BCRYPT_SALT_ROUNDS: '4',
  CORS_ORIGIN: 'http://localhost:3000',
  GOOGLE_CLIENT_ID: 'x',
  GOOGLE_CLIENT_SECRET: 'x',
  GOOGLE_CALLBACK_URL: 'http://localhost:4000/auth/google/callback',
  CLOUDINARY_CLOUD_NAME: 'x',
  CLOUDINARY_API_KEY: 'x',
  CLOUDINARY_API_SECRET: 'x',
};

const MESS_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MESS_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ALICE = '11111111-1111-4111-8111-111111111111'; // manager of mess A
const BOB = '22222222-2222-4222-8222-222222222222'; // member of mess A
const CAROL = '33333333-3333-4333-8333-333333333333'; // not in any mess

const users: Record<string, { id: string; email: string; name: string }> = {
  [ALICE]: { id: ALICE, email: 'alice@example.com', name: 'Alice' },
  [BOB]: { id: BOB, email: 'bob@example.com', name: 'Bob' },
  [CAROL]: { id: CAROL, email: 'carol@example.com', name: 'Carol' },
};

/** Who belongs where; read by every guard and service lookup. */
const memberships = [
  { id: 'm-alice', user_id: ALICE, mess_id: MESS_A, mess_role: 'MANAGER' },
  { id: 'm-bob', user_id: BOB, mess_id: MESS_A, mess_role: 'MEMBER' },
];

function stubDatabase() {
  prismaMock.users.findUnique.mockImplementation(
    ({ where }: { where: { id?: string; email?: string } }) => {
      const u = Object.values(users).find(
        (x) => x.id === where.id || x.email === where.email,
      );
      return u
        ? {
            ...u,
            password: null,
            phone: null,
            avatar: null,
            system_role: 'USER',
            manager_created: false,
            email_verified: true,
            deleted_at: null,
          }
        : null;
    },
  );
  prismaMock.mess_members.findFirst.mockImplementation(
    ({ where }: { where: Record<string, unknown> }) =>
      memberships.find(
        (m) =>
          (where.user_id === undefined || m.user_id === where.user_id) &&
          (where.mess_id === undefined || m.mess_id === where.mess_id) &&
          (where.mess_role === undefined || m.mess_role === where.mess_role),
      ) ?? null,
  );
  prismaMock.user_sessions.create.mockResolvedValue({});
}

describe('Authentication & authorization (HTTP)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;

  const tokenFor = (userId: string, secret = ENV.JWT_ACCESS_SECRET) =>
    jwt.sign(
      { email: users[userId]?.email ?? 'x@y.z', sid: 'session-1' },
      { secret, subject: userId, expiresIn: 3600 },
    );
  const http = () => request(app.getHttpServer());
  const as = (userId: string) => ({
    Authorization: `Bearer ${tokenFor(userId)}`,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ENV],
        }),
        AuthModule,
        UsersModule,
        MessesModule,
        InvitesModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    jwt = new JwtService({});
  });

  afterAll(() => app.close());

  beforeEach(() => {
    resetPrismaMock();
    stubDatabase();
  });

  describe('authentication on protected routes', () => {
    it('401 without a token', async () => {
      const res = await http().get('/users/me').expect(401);
      expect(res.body).toMatchObject({ success: false, statusCode: 401 });
    });

    it('401 for a malformed token', () =>
      http()
        .get('/users/me')
        .set('Authorization', 'Bearer not.a.jwt')
        .expect(401));

    it('401 for a token signed with another secret', () =>
      http()
        .get('/users/me')
        .set('Authorization', `Bearer ${tokenFor(ALICE, 'attacker')}`)
        .expect(401));

    it('401 for a refresh-secret token used as an access token', () =>
      http()
        .get('/users/me')
        .set(
          'Authorization',
          `Bearer ${tokenFor(ALICE, ENV.JWT_REFRESH_SECRET)}`,
        )
        .expect(401));

    it('401 for an expired token', () => {
      const expired = jwt.sign(
        { email: 'alice@example.com', exp: Math.floor(Date.now() / 1000) - 60 },
        { secret: ENV.JWT_ACCESS_SECRET, subject: ALICE },
      );
      return http()
        .get('/users/me')
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);
    });

    it('401 for an alg=none token', () => {
      const header = Buffer.from(
        JSON.stringify({ alg: 'none', typ: 'JWT' }),
      ).toString('base64url');
      const body = Buffer.from(
        JSON.stringify({ sub: ALICE, exp: 9999999999 }),
      ).toString('base64url');
      return http()
        .get('/users/me')
        .set('Authorization', `Bearer ${header}.${body}.`)
        .expect(401);
    });

    it('401 for a valid token whose user was deleted', async () => {
      prismaMock.users.findUnique.mockResolvedValue({
        ...users[ALICE],
        deleted_at: new Date(),
      });
      await http().get('/users/me').set(as(ALICE)).expect(401);
    });

    it('200 with a valid token', async () => {
      const res = await http().get('/users/me').set(as(ALICE)).expect(200);
      expect(res.body).toMatchObject({ id: ALICE });
      // The profile query must never select the password hash.
      const profileQuery = (
        prismaMock.users.findUnique.mock.calls as [
          { select?: Record<string, boolean> },
        ][]
      ).find(([args]) => args.select)?.[0];
      expect(profileQuery?.select).toBeDefined();
      expect(profileQuery?.select).not.toHaveProperty('password');
    });
  });

  describe('mess membership (MembershipGuard)', () => {
    it('403 when listing members of a mess you are not in', async () => {
      const res = await http()
        .get(`/messes/${MESS_A}/members`)
        .set(as(CAROL))
        .expect(403);
      expect(res.body.code).toBe(ErrorCode.NOT_MESS_MEMBER);
    });

    it('403 when a manager of mess A reads mess B', () =>
      http().get(`/messes/${MESS_B}/members`).set(as(ALICE)).expect(403));
  });

  describe('manager-only member management (RolesGuard)', () => {
    it('403 for a plain member adding someone', async () => {
      const res = await http()
        .post(`/messes/${MESS_A}/members`)
        .set(as(BOB))
        .send({ userId: CAROL })
        .expect(403);
      expect(res.body.code).toBe(ErrorCode.MANAGER_ONLY);
      expect(prismaMock.mess_members.create).not.toHaveBeenCalled();
    });

    it('403 for a plain member removing someone', async () => {
      await http()
        .delete(`/messes/${MESS_A}/members/${ALICE}`)
        .set(as(BOB))
        .expect(403);
      expect(prismaMock.mess_members.update).not.toHaveBeenCalled();
    });

    it('403 for a plain member promoting themselves', async () => {
      await http()
        .patch(`/messes/${MESS_A}/members/${BOB}/role`)
        .set(as(BOB))
        .send({ role: 'MANAGER' })
        .expect(403);
      expect(prismaMock.mess_members.update).not.toHaveBeenCalled();
    });

    it("403 for a manager acting on another mess's members", async () => {
      await http()
        .delete(`/messes/${MESS_B}/members/${CAROL}`)
        .set(as(ALICE))
        .expect(403);
      expect(prismaMock.mess_members.update).not.toHaveBeenCalled();
    });

    it('400 for a manager sending a bad body', async () => {
      const res = await http()
        .post(`/messes/${MESS_A}/members`)
        .set(as(ALICE))
        .send({ userId: 'not-a-uuid' })
        .expect(400);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('a manager can remove a member of their own mess', async () => {
      await http()
        .delete(`/messes/${MESS_A}/members/${BOB}`)
        .set(as(ALICE))
        .expect(200);
      expect(prismaMock.mess_members.update).toHaveBeenCalledWith({
        where: { id: 'm-bob' },
        data: { removed_at: expect.any(Date) },
      });
    });
  });

  describe('invites and manager-created accounts', () => {
    it('403 for a plain member sending an invite', async () => {
      const res = await http()
        .post('/invites')
        .set(as(BOB))
        .send({ email: 'carol@example.com' })
        .expect(403);
      expect(res.body.code).toBe(ErrorCode.MANAGER_ONLY);
    });

    it('403 for someone with no mess sending an invite', async () => {
      const res = await http()
        .post('/invites')
        .set(as(CAROL))
        .send({ email: 'bob@example.com' })
        .expect(403);
      expect(res.body.code).toBe(ErrorCode.NO_ACTIVE_MESS);
    });

    it('400 when an invite names both a user and an email', () =>
      http()
        .post('/invites')
        .set(as(ALICE))
        .send({ userId: CAROL, email: 'carol@example.com' })
        .expect(400));

    it('400 for a non-uuid invite id on accept', () =>
      http().post('/invites/abc/accept').set(as(CAROL)).expect(400));

    it("400 when accepting someone else's invite", async () => {
      prismaMock.join_requests.findFirst.mockImplementation(
        ({ where }: { where: { user_id: string } }) =>
          where.user_id === CAROL ? { id: 'x' } : null,
      );
      await http().post(`/invites/${MESS_B}/accept`).set(as(BOB)).expect(400);
      expect(prismaMock.mess_members.create).not.toHaveBeenCalled();
    });

    it('403 for a plain member creating a member account', async () => {
      await http()
        .post('/users/create-member')
        .set(as(BOB))
        .send({
          name: 'New Person',
          email: 'new@example.com',
          password: 'password-123',
          messId: MESS_A,
        })
        .expect(403);
      expect(prismaMock.users.create).not.toHaveBeenCalled();
    });

    it('403 for a manager creating an account in a mess they do not manage', async () => {
      await http()
        .post('/users/create-member')
        .set(as(ALICE))
        .send({
          name: 'New Person',
          email: 'new@example.com',
          password: 'password-123',
          messId: MESS_B,
        })
        .expect(403);
      expect(prismaMock.users.create).not.toHaveBeenCalled();
    });

    it('403 for a plain member searching users', () =>
      http().get('/users/search?q=carol').set(as(BOB)).expect(403));
  });

  describe('/auth endpoints', () => {
    it('signin: 400 for an invalid email', async () => {
      const res = await http()
        .post('/auth/signin')
        .send({ email: 'nope', password: 'x' })
        .expect(400);
      expect(res.body.code).toBe(ErrorCode.VALIDATION_FAILED);
    });

    it('signin: 401 for a wrong password, same message as an unknown email', async () => {
      const hash = await bcrypt.hash('right-password', 4);
      prismaMock.users.findUnique.mockImplementation(
        ({ where }: { where: { email?: string; id?: string } }) =>
          where.email === 'alice@example.com' || where.id === ALICE
            ? { ...users[ALICE], password: hash, deleted_at: null }
            : null,
      );

      const wrong = await http()
        .post('/auth/signin')
        .send({ email: 'alice@example.com', password: 'wrong-password' })
        .expect(401);
      const unknown = await http()
        .post('/auth/signin')
        .send({ email: 'ghost@example.com', password: 'wrong-password' })
        .expect(401);

      expect(wrong.body.code).toBe(ErrorCode.INVALID_CREDENTIALS);
      expect(wrong.body.message).toBe(unknown.body.message);
    });

    it('signin: 200 sets an HttpOnly, Secure refresh cookie and returns an access token', async () => {
      const hash = await bcrypt.hash('right-password', 4);
      prismaMock.users.findUnique.mockImplementation(
        ({ where }: { where: { email?: string; id?: string } }) =>
          where.email === 'alice@example.com' || where.id === ALICE
            ? { ...users[ALICE], password: hash, deleted_at: null }
            : null,
      );

      const res = await http()
        .post('/auth/signin')
        .send({ email: 'alice@example.com', password: 'right-password' })
        .expect(200);

      const body = res.body as { data: { accessToken: string } };
      const payload = jwt.verify<{ sub: string }>(body.data.accessToken, {
        secret: ENV.JWT_ACCESS_SECRET,
      });
      expect(payload.sub).toBe(ALICE);

      const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
      const refresh = cookies.find((c) => c.startsWith('refresh_token='));
      expect(refresh).toBeDefined();
      expect(refresh).toMatch(/HttpOnly/i);
      expect(refresh).toMatch(/Secure/i);
      expect(refresh).toMatch(/SameSite=Lax/i);
      expect(JSON.stringify(res.body)).not.toContain('refresh');
    });

    // BUG: signup calls `signUpSchema.parse()` instead of `safeParse()`, so
    // a bad body throws a raw ZodError that the exception filter turns into
    // a 500 "Something went wrong" instead of a 400 with field errors.
    it.failing(
      'signup: 400 with field errors for an invalid body',
      async () => {
        const res = await http()
          .post('/auth/signup')
          .send({ name: 'A', email: 'bad', password: '1' });
        expect(res.status).toBe(400);
        expect(res.body.code).toBe(ErrorCode.VALIDATION_FAILED);
      },
    );

    it('refresh: 401 without the cookie', () =>
      http().post('/auth/refresh').expect(401));

    it('refresh: 401 for a forged cookie', () =>
      http()
        .post('/auth/refresh')
        .set('Cookie', 'refresh_token=forged.token.value')
        .expect(401));

    it('logout: works without being signed in and clears both cookies', async () => {
      const res = await http().post('/auth/logout').expect(200);
      const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
      expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
      expect(cookies.some((c) => c.startsWith('access_token=;'))).toBe(true);
    });
  });
});
