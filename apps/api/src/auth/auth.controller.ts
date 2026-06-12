import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';
import { SignupDto } from '@repo/shared';
import { AuthService, AuthUser } from './auth.service';
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
  async signup(@Body() signupDto: SignupDto, @Res() res: Response) {
    const { accessToken, refreshToken } =
      await this.authService.register(signupDto);

    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('signin')
  async signin(@Req() req: SigninRequest, @Res() res: Response) {
    const user: AuthUser | undefined = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { accessToken, refreshToken } = await this.authService.login(user);

    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: RefreshRequest, @Res() res: Response) {
    const refreshToken = (req.cookies as Record<string, string> | undefined)
      ?.refresh_token;
    if (!refreshToken)
      return res.status(401).json({ message: 'Missing refresh token' });

    // AuthService performs bcrypt refresh-hash verification; we only need userId from refresh token.
    // Refresh token format is JWT; we can decode payload safely without verifying signature.
    const [, payloadPart] = refreshToken.split('.');
    if (!payloadPart)
      return res.status(401).json({ message: 'Invalid refresh token' });

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
    if (!userId)
      return res.status(401).json({ message: 'Invalid refresh token' });

    try {
      const { accessToken, refreshToken: newRefresh } =
        await this.authService.refreshTokens(userId, refreshToken);

      this.setRefreshCookie(res, newRefresh);
      return { accessToken };
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }

  @Post('logout')
  async logout(
    @Req() req: Request & { user?: { id?: string } },
    @Res() res: Response,
  ) {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

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
