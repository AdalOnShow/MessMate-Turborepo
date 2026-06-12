import {
  BadRequestException,
  Injectable,
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
  system_role: unknown; // keep loose to avoid importing Prisma enum typing
};

@Injectable()
export class AuthService {
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
    if (!user) return null;

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
    if (!user?.password) return null;

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      system_role: user.system_role,
    };
  }

  private async hashRefreshToken(refreshToken: string): Promise<string> {
    const saltRounds =
      this.configService.get<number>('BCRYPT_SALT_ROUNDS') ?? 10;
    return bcrypt.hash(refreshToken, saltRounds);
  }

  async register(signupDto: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const existing = await prisma.users.findUnique({
      where: { email: signupDto.email },
    });
    if (existing) throw new BadRequestException('Email already in use');

    const saltRounds =
      this.configService.get<number>('BCRYPT_SALT_ROUNDS') ?? 10;
    const hashedPassword = await bcrypt.hash(signupDto.password, saltRounds);

    const user = await prisma.users.create({
      data: {
        name: signupDto.name,
        email: signupDto.email,
        password: hashedPassword,
        phone: signupDto.phone ?? null,
      },
    });

    const accessToken = await this.createAccessToken(user);
    const refreshToken = await this.createRefreshToken(user);

    const hashedRefreshToken = await this.hashRefreshToken(refreshToken);
    await prisma.users.update({
      where: { id: user.id },
      data: { refresh_token: hashedRefreshToken },
    });

    return { accessToken, refreshToken };
  }

  async login(
    user: AuthUser,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const dbUser = await prisma.users.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.createAccessToken(dbUser);
    const refreshToken = await this.createRefreshToken(dbUser);

    const hashedRefreshToken = await this.hashRefreshToken(refreshToken);
    await prisma.users.update({
      where: { id: dbUser.id },
      data: { refresh_token: hashedRefreshToken },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user?.refresh_token)
      throw new UnauthorizedException('Invalid refresh token');

    const matches = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!matches) throw new UnauthorizedException('Invalid refresh token');

    const accessToken = await this.createAccessToken(user);
    const newRefreshToken = await this.createRefreshToken(user);

    const hashedNewRefreshToken = await this.hashRefreshToken(newRefreshToken);
    await prisma.users.update({
      where: { id: user.id },
      data: { refresh_token: hashedNewRefreshToken },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string): Promise<void> {
    await prisma.users.update({
      where: { id: userId },
      data: { refresh_token: null },
    });
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
