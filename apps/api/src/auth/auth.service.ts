import { ErrorCode } from '@repo/shared';
import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
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
  refreshToken: string;
};

/** Short-lived: a revoked session stops working within this window. */
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
/** Sliding: every refresh pushes a session's expiry this far out. */
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

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

  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    const user = await prisma.users.findUnique({
      where: { email: normalizeEmail(email) },
    });
    if (!user?.password) {
      this.logger.warn(`⚠️ Login attempt with non-existent email: ${email}`);
      return null;
    }

    if (user.deleted_at) {
      this.logger.warn(`⚠️ Login attempt by deleted user: ${email}`);
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
  ): Promise<AuthTokens> {
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

  async login(user: AuthUser, userAgent?: string): Promise<AuthTokens> {
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
  ): Promise<AuthTokens> {
    const sessionId = randomUUID();
    const refreshToken = await this.jwtService.signAsync(
      { sid: sessionId },
      // No `exp` in the token: expiry lives on the session row so it can
      // slide forward on use and be revoked.
      { secret: this.refreshSecret, subject: user.id },
    );

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
   * Issues a new access token for a live session and extends the session.
   *
   * The refresh token itself is not rotated: several requests can hit a 401
   * at the same moment and refresh in parallel, and with rotation all but
   * the first would fail and sign the user out.
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const { userId, sessionId } = await this.verifyRefreshToken(refreshToken);
    const now = new Date();

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

    if (
      !session ||
      session.user.deleted_at ||
      !sameHash(hashToken(refreshToken), session.token_hash)
    ) {
      this.logger.warn(`⚠️ Refresh rejected for user: ${userId}`);
      throw new UnauthorizedException({
        message: 'Invalid refresh token',
        code: ErrorCode.SESSION_EXPIRED,
      });
    }

    await prisma.user_sessions.update({
      where: { id: session.id },
      data: {
        last_used_at: now,
        expires_at: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
      },
    });

    const accessToken = await this.createAccessToken(session.user, session.id);
    return { accessToken, refreshToken };
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
