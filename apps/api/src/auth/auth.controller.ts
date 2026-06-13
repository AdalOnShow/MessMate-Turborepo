import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';
import { SignupDto } from '@repo/shared';
import { ApiResponse, AuthTokensResponse } from '@repo/shared';
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
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  async signup(
    @Body() signupDto: SignupDto,
    @Res() res: Response,
  ): Promise<ApiResponse<AuthTokensResponse>> {
    const tokens: AuthTokens = await this.authService.register(signupDto);

    this.setRefreshCookie(res, tokens.refreshToken);
    return {
      success: true,
      message: 'Signup successful',
      data: {
        accessToken: tokens.accessToken,
      },
    };
  }

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('signin')
  async signin(
    @Req() req: SigninRequest,
    @Res() res: Response,
  ): Promise<ApiResponse<AuthTokensResponse>> {
    const user: AuthUser | undefined = req.user;
    if (!user) throw new UnauthorizedException('Unauthorized');

    const tokens: AuthTokens = await this.authService.login(user);

    this.setRefreshCookie(res, tokens.refreshToken);
    return {
      success: true,
      message: 'Signin successful',
      data: {
        accessToken: tokens.accessToken,
      },
    };
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: RefreshRequest,
    @Res() res: Response,
  ): Promise<ApiResponse<AuthTokensResponse>> {
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
      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: tokens.accessToken,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  async logout(
    @Req() req: Request & { user?: { id?: string } },
    @Res() res: Response,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('Unauthorized');

    await this.authService.logout(userId);

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth/refresh',
    });

    return { ok: true };
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
