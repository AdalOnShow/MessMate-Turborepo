import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { signUpSchema, type SignupDto } from '@repo/shared';
import { AuthService, AuthTokens, AuthUser } from './auth.service';
import { Public } from './guards/public.decorator';

type SigninRequest = Request & {
  user?: AuthUser;
};

type RefreshRequest = Request & {
  cookies?: {
    refresh_token?: string;
  };
};

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly webAppUrl: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.webAppUrl = this.configService.getOrThrow<string>('CORS_ORIGIN');
    this.refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  async signup(
    @Body() signupDto: SignupDto,
    @Res() res: Response,
  ): Promise<void> {
    const parsedSignup = signUpSchema.parse(signupDto);
    this.logger.log(`📝 POST /auth/signup - email: ${parsedSignup.email}`);

    const tokens: AuthTokens = await this.authService.register(parsedSignup);

    this.setRefreshCookie(res, tokens.refreshToken);
    this.logger.log(`✅ Signup completed for: ${parsedSignup.email}`);
    res.status(201).json({
      success: true,
      message: 'Signup successful',
      data: {
        accessToken: tokens.accessToken,
      },
    });
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AuthGuard('local'))
  @Post('signin')
  async signin(@Req() req: SigninRequest, @Res() res: Response): Promise<void> {
    const user: AuthUser | undefined = req.user;
    if (!user) throw new UnauthorizedException('Unauthorized');

    this.logger.log(`🔐 POST /auth/signin - user: ${user.email}`);

    const tokens: AuthTokens = await this.authService.login(user);

    this.setRefreshCookie(res, tokens.refreshToken);
    this.logger.log(`✅ Signin completed for: ${user.email}`);
    res.status(200).json({
      success: true,
      message: 'Signin successful',
      data: {
        accessToken: tokens.accessToken,
      },
    });
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Req() req: RefreshRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log('🔄 POST /auth/refresh');

    const refreshToken = (req.cookies as Record<string, string> | undefined)
      ?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    let userId: string;
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(
        refreshToken,
        { secret: this.refreshSecret },
      );
      userId = payload.sub;
      if (!userId) throw new UnauthorizedException('Invalid refresh token');
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      const tokens: AuthTokens = await this.authService.refreshTokens(
        userId,
        refreshToken,
      );

      this.setRefreshCookie(res, tokens.refreshToken);
      this.logger.log(`✅ Token refreshed for user: ${userId}`);
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    this.logger.log('🔐 GET /auth/google - initiating Google OAuth');
  }

  @Post('logout')
  async logout(
    @Req() req: Request & { user?: { id?: string } },
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Unauthorized');

    this.logger.log(`🚪 POST /auth/logout - user: ${userId}`);

    await this.authService.logout(userId);

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });

    this.logger.log(`✅ Logout completed for user: ${userId}`);
    res.status(200).json({ success: true, message: 'Logged out' });
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req()
    req: Request & { user?: AuthUser | { error: string; message: string } },
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user;

    // Handle strategy-level errors (passed via done(null, { error, message }))
    if (!user || (typeof user === 'object' && 'error' in user)) {
      const errorCode =
        user && 'error' in user ? user.error : 'google_auth_failed';
      const errorMessage =
        user && 'message' in user
          ? user.message
          : 'Google authentication failed';
      this.logger.warn(`❌ Google OAuth error: ${errorCode} - ${errorMessage}`);
      res.redirect(`${this.webAppUrl}/signin?error=${errorCode}`);
      return;
    }

    // TypeScript knows user is AuthUser here
    const authUser = user as AuthUser;
    this.logger.log(`🔐 Google OAuth callback for user: ${authUser.email}`);

    try {
      const tokens: AuthTokens = await this.authService.login(authUser);

      this.setRefreshCookie(res, tokens.refreshToken);
      this.setAccessCookie(res, tokens.accessToken);
      this.logger.log(`✅ Google OAuth completed for: ${authUser.email}`);
      res.redirect(`${this.webAppUrl}/dashboard`);
    } catch (error) {
      this.logger.error(
        `❌ Google OAuth callback failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      res.redirect(`${this.webAppUrl}/signin?error=google_auth_failed`);
    }
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });
  }

  private setAccessCookie(res: Response, accessToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
