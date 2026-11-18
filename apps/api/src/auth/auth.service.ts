import { ErrorCode } from '@repo/shared';
import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@repo/database';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  system_role: unknown;
};

export type AuthTokens = {
  accessToken: string;
  /**
   * New refresh token after a rotation. Null when a parallel refresh within
   * the grace period used the previous token: the client keeps the cookie
   * the other request already set.
   */
  refreshToken: string | null;
};

/** Tokens of a newly created session: both are always issued. */
export type SessionTokens = { accessToken: string; refreshToken: string };

/**
 * 7 days. Long-lived is fine here: JwtStrategy checks the session on every
 * request, so logout or a password change still cuts an access token off
 * at once.
 */
export const ACCESS_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
/**
 * Sliding: every refresh (about weekly, when the access token runs out)
 * rotates the refresh token and pushes the session's expiry 30 days out, so
 * someone who opens the app at least once a month is never signed out.
 */
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
/** How long a just-rotated refresh token is still accepted. */
export const ROTATION_GRACE_SECONDS = 2 * 60;

/** Emails are stored and compared in lower case. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, 'hex');
  const y = Buffer.from(b, 'hex');
  return x.length === y.length && timingSafeEqual(x, y);
}

// Hash of a random value nobody knows, compared against when the account
// doesn't exist (see validateUser). Same cost as stored password hashes.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  randomBytes(16).toString('hex'),
  Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
);

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async findUserById(userId: string): Promise<AuthUser | null> {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`⚠️ User not found: ${userId}`);
      return null;
    }

    if (user.deleted_at) {
      this.logger.warn(`⚠️ Access attempt by deleted user: ${userId}`);
      return null;
    }

    this.logger.debug(`🔍 User found: ${user.id} (${user.email})`);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      system_role: user.system_role,
    };
  }

  /**
   * The user behind an access token, only while the token's session is
   * live. Logging out or changing the password revokes sessions; without
   * this check their access tokens kept working until they expired (1h).
   */
  async findUserBySession(
    userId: string,
    sessionId: string,
  ): Promise<AuthUser | null> {
    const session = await prisma.user_sessions.findFirst({
      where: {
        id: sessionId,
        user_id: userId,
        revoked_at: null,
        expires_at: { gt: new Date() },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            system_role: true,
            deleted_at: true,
          },
        },
      },
    });
    const user = session?.user;
    if (!user || user.deleted_at) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      system_role: user.system_role,
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await prisma.users.findUnique({
      where: { email: normalizeEmail(email) },
    });
    if (!user?.password || user.deleted_at) {
      // Same bcrypt cost as a real check, so response time doesn't reveal
      // whether an account exists.
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      this.logger.warn(`⚠️ Login attempt for unknown or deleted account`);
      return null;
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      this.logger.warn(`⚠️ Invalid password for email: ${email}`);
      return null;
    }

    this.logger.log(`✅ User validated: ${email}`);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      system_role: user.system_role,
    };
  }

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string | null;
  }): Promise<AuthUser> {
    this.logger.log(
      `📝 Google OAuth: finding or creating user for ${profile.email}`,
    );

    const existingOAuth = await prisma.oauth_accounts.findFirst({
      where: {
        provider: 'google',
        provider_user_id: profile.googleId,
      },
      include: { user: true },
    });

    if (existingOAuth) {
      this.logger.log(
        `✅ Google OAuth: existing user found: ${existingOAuth.user.id}`,
      );
      return {
        id: existingOAuth.user.id,
        email: existingOAuth.user.email,
        name: existingOAuth.user.name,
        system_role: existingOAuth.user.system_role,
      };
    }

    const email = normalizeEmail(profile.email);
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(
        `🔗 Google OAuth: rejected auto-linking for existing user: ${existingUser.id}`,
      );
      throw new UnauthorizedException({
        message:
          'An account with this email already exists. Please sign in with your password or link your Google account from settings after signing in.',
        code: ErrorCode.EMAIL_IN_USE,
      });
    }

    this.logger.log(`📝 Google OAuth: creating new user for ${profile.email}`);
    const user = await prisma.users.create({
      data: {
        name: profile.name,
        email,
        avatar: profile.avatar ?? null,
        email_verified: true,
        oauth_accounts: {
          create: {
            provider: 'google',
            provider_user_id: profile.googleId,
          },
        },
      },
      include: { oauth_accounts: true },
    });

    this.logger.log(`✅ Google OAuth: new user created: ${user.id}`);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      system_role: user.system_role,
    };
  }

  async register(
    signupDto: {
      name: string;
      email: string;
      password: string;
      phone?: string;
    },
    userAgent?: string,
  ): Promise<SessionTokens> {
    this.logger.log(`📝 Registration attempt for email: ${signupDto.email}`);

    const email = normalizeEmail(signupDto.email);
    const existing = await prisma.users.findUnique({
      where: { email },
    });
    if (existing) {
      this.logger.warn(`⚠️ Duplicate email registration: ${signupDto.email}`);
      throw new ConflictException({
        message: 'Email already in use',
        code: ErrorCode.EMAIL_IN_USE,
      });
    }

    const saltRounds = Number(
      this.configService.get('BCRYPT_SALT_ROUNDS') ?? 10,
    );
    const hashedPassword = await bcrypt.hash(signupDto.password, saltRounds);

    const user = await prisma.users.create({
      data: {
        name: signupDto.name,
        email,
        password: hashedPassword,
        phone: signupDto.phone ?? null,
      },
    });

    this.logger.log(
      `✅ User registered: id=${user.id}, email=${user.email}, name=${user.name}`,
    );

    const tokens = await this.createSession(user, userAgent);
    this.logger.log(`🔑 Tokens issued for new user: ${user.id}`);
    return tokens;
  }

  async login(user: AuthUser, userAgent?: string): Promise<SessionTokens> {
    this.logger.log(`🔐 Login for user: ${user.id} (${user.email})`);

    const dbUser = await prisma.users.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      this.logger.error(`❌ Login failed - user not in DB: ${user.id}`);
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        code: ErrorCode.INVALID_CREDENTIALS,
      });
    }

    const tokens = await this.createSession(dbUser, userAgent);
    this.logger.log(`✅ Login successful for user: ${dbUser.id}`);
    return tokens;
  }

  /**
   * One session per signed-in device, so signing in on a phone no longer
   * signs the laptop out. The refresh token carries the session id and only
   * its hash is stored.
   */
  private async createSession(
    user: { id: string; email: string },
    userAgent?: string,
  ): Promise<SessionTokens> {
    const sessionId = randomUUID();
    const refreshToken = await this.signRefreshToken(user.id, sessionId);

    await prisma.user_sessions.create({
      data: {
        id: sessionId,
        user_id: user.id,
        token_hash: hashToken(refreshToken),
        user_agent: userAgent?.slice(0, 255) || null,
        expires_at: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
      },
    });

    const accessToken = await this.createAccessToken(user, sessionId);
    return { accessToken, refreshToken };
  }

  /**
   * A refresh token for a session. The random `jti` makes every token
   * different, so a rotated one can't equal the one it replaces. No `exp`:
   * expiry lives on the session row so it can slide and be revoked.
   */
  private signRefreshToken(userId: string, sessionId: string) {
    return this.jwtService.signAsync(
      { sid: sessionId, jti: randomUUID() },
      { secret: this.refreshSecret, subject: userId },
    );
  }

  /** Reads `{ sub, sid }` from a refresh token, or throws 401. */
  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ userId: string; sessionId: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub?: string;
        sid?: string;
      }>(refreshToken, { secret: this.refreshSecret });
      if (payload.sub && payload.sid) {
        return { userId: payload.sub, sessionId: payload.sid };
      }
    } catch {
      // fall through
    }
    throw new UnauthorizedException({
      message: 'Invalid refresh token',
      code: ErrorCode.SESSION_EXPIRED,
    });
  }

  /**
   * Issues a new access token, rotates the refresh token and slides the
   * session's expiry 30 days out.
   *
   * Several requests can hit an expired access token together and refresh
   * in parallel. Only one rotates (the update is conditional on the hash it
   * read); the others present the token that was just replaced, which is
   * accepted for ROTATION_GRACE_SECONDS and gets an access token only. An
   * old token presented later is rejected.
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const { userId, sessionId } = await this.verifyRefreshToken(refreshToken);
    const now = new Date();
    const presented = hashToken(refreshToken);

    const session = await prisma.user_sessions.findFirst({
      where: {
        id: sessionId,
        user_id: userId,
        revoked_at: null,
        expires_at: { gt: now },
      },
      include: {
        user: { select: { id: true, email: true, deleted_at: true } },
      },
    });

    const reject = () => {
      this.logger.warn(`⚠️ Refresh rejected for user: ${userId}`);
      return new UnauthorizedException({
        message: 'Invalid refresh token',
        code: ErrorCode.SESSION_EXPIRED,
      });
    };
    if (!session || session.user.deleted_at) throw reject();

    const withinGrace = (s: {
      previous_token_hash: string | null;
      rotated_at: Date | null;
    }) =>
      !!s.previous_token_hash &&
      !!s.rotated_at &&
      sameHash(presented, s.previous_token_hash) &&
      now.getTime() - s.rotated_at.getTime() <= ROTATION_GRACE_SECONDS * 1000;

    const graceTokens = async (): Promise<AuthTokens> => ({
      accessToken: await this.createAccessToken(session.user, session.id),
      refreshToken: null,
    });

    if (!sameHash(presented, session.token_hash)) {
      if (withinGrace(session)) return graceTokens();
      throw reject();
    }

    const nextToken = await this.signRefreshToken(userId, session.id);
    const { count } = await prisma.user_sessions.updateMany({
      // Only if nobody rotated it since we read it.
      where: { id: session.id, token_hash: session.token_hash },
      data: {
        previous_token_hash: session.token_hash,
        token_hash: hashToken(nextToken),
        rotated_at: now,
        last_used_at: now,
        expires_at: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
      },
    });

    if (count === 0) {
      // A parallel request rotated first; ours is now the previous token.
      const fresh = await prisma.user_sessions.findFirst({
        where: { id: session.id, revoked_at: null },
        select: { previous_token_hash: true, rotated_at: true },
      });
      if (fresh && withinGrace(fresh)) return graceTokens();
      throw reject();
    }

    const accessToken = await this.createAccessToken(session.user, session.id);
    return { accessToken, refreshToken: nextToken };
  }

  /** Ends the session the refresh token belongs to. Never throws. */
  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return;
    try {
      const { userId, sessionId } = await this.verifyRefreshToken(refreshToken);
      await prisma.user_sessions.updateMany({
        where: { id: sessionId, user_id: userId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      this.logger.log(`🚪 Session ended: ${sessionId}`);
    } catch {
      // An invalid or expired token has nothing to revoke.
    }
  }

  private async createAccessToken(
    user: { id: string; email: string },
    sessionId: string,
  ): Promise<string> {
    return this.jwtService.signAsync(
      { email: user.email, sid: sessionId },
      {
        secret: this.accessSecret,
        subject: user.id,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      },
    );
  }
}
