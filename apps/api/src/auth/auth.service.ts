import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user?.password) {
      this.logger.warn(`⚠️ Login attempt with non-existent email: ${email}`);
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

    const existingUser = await prisma.users.findUnique({
      where: { email: profile.email },
    });

    if (existingUser) {
      this.logger.warn(
        `🔗 Google OAuth: rejected auto-linking for existing user: ${existingUser.id}`,
      );
      throw new UnauthorizedException(
        'An account with this email already exists. Please sign in with your password or link your Google account from settings after signing in.',
      );
    }

    this.logger.log(`📝 Google OAuth: creating new user for ${profile.email}`);
    const user = await prisma.users.create({
      data: {
        name: profile.name,
        email: profile.email,
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

  private async hashRefreshToken(refreshToken: string): Promise<string> {
    const saltRounds = Number(
      this.configService.get('BCRYPT_SALT_ROUNDS') ?? 10,
    );

    return bcrypt.hash(refreshToken, saltRounds);
  }

  async register(signupDto: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthTokens> {
    this.logger.log(`📝 Registration attempt for email: ${signupDto.email}`);

    const existing = await prisma.users.findUnique({
      where: { email: signupDto.email },
    });
    if (existing) {
      this.logger.warn(`⚠️ Duplicate email registration: ${signupDto.email}`);
      throw new BadRequestException('Email already in use');
    }

    const saltRounds = Number(
      this.configService.get('BCRYPT_SALT_ROUNDS') ?? 10,
    );
    const hashedPassword = await bcrypt.hash(signupDto.password, saltRounds);

    const user = await prisma.users.create({
      data: {
        name: signupDto.name,
        email: signupDto.email,
        password: hashedPassword,
        phone: signupDto.phone ?? null,
      },
    });

    this.logger.log(
      `✅ User registered: id=${user.id}, email=${user.email}, name=${user.name}`,
    );

    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);

    const hashedRefreshToken = await this.hashRefreshToken(refreshToken);
    await prisma.users.update({
      where: { id: user.id },
      data: { refresh_token: hashedRefreshToken },
    });

    this.logger.log(`🔑 Tokens issued for new user: ${user.id}`);
    return { accessToken, refreshToken };
  }

  async login(user: AuthUser): Promise<AuthTokens> {
    this.logger.log(`🔐 Login for user: ${user.id} (${user.email})`);

    const dbUser = await prisma.users.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      this.logger.error(`❌ Login failed - user not in DB: ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.createAccessToken(dbUser);
    const refreshToken = await this.createRefreshToken(dbUser);

    const hashedRefreshToken = await this.hashRefreshToken(refreshToken);
    await prisma.users.update({
      where: { id: dbUser.id },
      data: { refresh_token: hashedRefreshToken },
    });

    this.logger.log(`✅ Login successful for user: ${dbUser.id}`);
    return { accessToken, refreshToken };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokens> {
    this.logger.log(`🔄 Token refresh for user: ${userId}`);

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user?.refresh_token) {
      this.logger.warn(`⚠️ Refresh failed - no stored token: ${userId}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const matches = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!matches) {
      this.logger.warn(`⚠️ Refresh failed - token mismatch: ${userId}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.createAccessToken(user);
    const newRefreshToken = await this.createRefreshToken(user);

    const hashedNewRefreshToken = await this.hashRefreshToken(newRefreshToken);
    await prisma.users.update({
      where: { id: user.id },
      data: { refresh_token: hashedNewRefreshToken },
    });

    this.logger.log(`✅ Token refresh successful for user: ${userId}`);
    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string): Promise<void> {
    this.logger.log(`🚪 Logout for user: ${userId}`);

    await prisma.users.update({
      where: { id: userId },
      data: { refresh_token: null },
    });

    this.logger.log(`✅ Refresh token cleared for user: ${userId}`);
  }

  private async createAccessToken(user: {
    id: string;
    email: string;
  }): Promise<string> {
    return this.jwtService.signAsync(
      { email: user.email },
      {
        secret: this.accessSecret,
        subject: user.id,
        expiresIn: '7d',
      },
    );
  }

  private async createRefreshToken(user: { id: string }): Promise<string> {
    return this.jwtService.signAsync(
      {},
      {
        secret: this.refreshSecret,
        subject: user.id,
        expiresIn: '30d',
      },
    );
  }
}
