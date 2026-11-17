import {
  BadRequestException,
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
import { formatZodError, signUpSchema } from '@repo/shared';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  AuthService,
  AuthTokens,
  AuthUser,
  SESSION_TTL_SECONDS,
} from './auth.service';
import { Public } from './guards/public.decorator';

type SigninRequest = Request & {
  user?: AuthUser;
};

/**
 * Reads one cookie from the raw header. The API has no cookie-parser, so
 * `req.cookies` is always undefined; reading it made every refresh fail.
 */
function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      const value = part.slice(eq + 1).trim();
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }
  return undefined;
}

/** The web app calls us from its server, so it forwards the browser's UA. */
function clientUserAgent(req: Request): string | undefined {
  const forwarded = req.headers['x-client-user-agent'];
  if (typeof forwarded === 'string' && forwarded) return forwarded;
  return req.headers['user-agent'];
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly webAppUrl: string;
  private readonly cookieDomain?: string;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    // CORS_ORIGIN may be a comma-separated list; redirect to the first entry.
    this.webAppUrl = this.configService
      .getOrThrow<string>('CORS_ORIGIN')
      .split(',')[0]!
      .trim()
      .replace(/\/$/, '');
    this.cookieDomain =
      this.configService.get<string>('COOKIE_DOMAIN') || undefined;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  async signup(
    @Body() body: unknown,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // safeParse, not parse: a thrown ZodError became a 500.
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: formatZodError(parsed.error),
      });
    }
    const parsedSignup = parsed.data;
    this.logger.log(`📝 POST /auth/signup - email: ${parsedSignup.email}`);

    const tokens: AuthTokens = await this.authService.register(
      parsedSignup,
      clientUserAgent(req),
    );

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

    const tokens: AuthTokens = await this.authService.login(
      user,
      clientUserAgent(req),
    );

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
  async refresh(@Req() req: Request, @Res() res: Response): Promise<void> {
    const refreshToken = readCookie(req, 'refresh_token');
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Re-sent so the cookie's lifetime slides with the session.
    this.setRefreshCookie(res, tokens.refreshToken);
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
      },
    });
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    this.logger.log('🔐 GET /auth/google - initiating Google OAuth');
  }

  /**
   * Public on purpose: it identifies the session by the refresh cookie, so
   * signing out still works after the access token has expired.
   */
  @Public()
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.authService.logout(readCookie(req, 'refresh_token'));

    res.clearCookie('refresh_token', this.cookieOptions());
    res.clearCookie('access_token', this.cookieOptions());
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
      const tokens: AuthTokens = await this.authService.login(
        authUser,
        clientUserAgent(req),
      );

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

  private cookieOptions(): Record<string, unknown> {
    return {
      httpOnly: true,
      secure: true,
      // Lax, not strict: strict cookies are not sent when the user arrives
      // from another site (end of the Google redirect, a shared link), so
      // those visits looked signed out.
      sameSite: 'lax',
      path: '/',
      ...(this.cookieDomain ? { domain: this.cookieDomain } : {}),
    };
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      ...this.cookieOptions(),
      maxAge: SESSION_TTL_SECONDS * 1000,
    });
  }

  private setAccessCookie(res: Response, accessToken: string) {
    res.cookie('access_token', accessToken, {
      ...this.cookieOptions(),
      maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    });
  }
}
