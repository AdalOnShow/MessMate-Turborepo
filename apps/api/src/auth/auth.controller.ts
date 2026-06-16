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
import { SignupDto } from '@repo/shared';
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

type RefreshPayload = {
  sub?: string;
};

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly webAppUrl: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.webAppUrl = this.configService.getOrThrow<string>('CORS_ORIGIN');
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  async signup(
    @Body() signupDto: SignupDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`📝 POST /auth/signup - email: ${signupDto.email}`);

    const tokens: AuthTokens = await this.authService.register(signupDto);

    this.setRefreshCookie(res, tokens.refreshToken);
    this.logger.log(`✅ Signup completed for: ${signupDto.email}`);
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
  @Post('refresh')
  async refresh(
    @Req() req: RefreshRequest,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log('🔄 POST /auth/refresh');

    const refreshToken = (req.cookies as Record<string, string> | undefined)
      ?.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    const [, payloadPart] = refreshToken.split('.');
    if (!payloadPart) throw new UnauthorizedException('Invalid refresh token');

    const decodedString = Buffer.from(payloadPart, 'base64url').toString(
      'utf8',
    );
    let payload: RefreshPayload | null = null;

    try {
      payload = JSON.parse(decodedString) as RefreshPayload;
    } catch {
      payload = null;
    }

    const userId = payload?.sub;
    if (!userId) throw new UnauthorizedException('Invalid refresh token');

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
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    this.logger.log('🔐 GET /auth/google - initiating Google OAuth');
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & { user?: AuthUser },
    @Res() res: Response,
  ): Promise<void> {
    const user = req.user;
    if (!user) {
      this.logger.error('❌ Google OAuth callback: no user found');
      res.redirect(`${this.webAppUrl}/signin?error=google_auth_failed`);
      return;
    }

    this.logger.log(`🔐 Google OAuth callback for user: ${user.email}`);

    try {
      const tokens: AuthTokens = await this.authService.login(user);

      this.setRefreshCookie(res, tokens.refreshToken);
      this.logger.log(`✅ Google OAuth completed for: ${user.email}`);
      res.redirect(
        `${this.webAppUrl}/signin?access_token=${tokens.accessToken}`,
      );
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
}
