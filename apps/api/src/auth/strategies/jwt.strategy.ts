import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: { sub?: string; email?: string; sid?: string }) {
    // Every access token carries its session id (sid). A token without one,
    // or whose session was revoked, is rejected; the web app then refreshes,
    // which fails for a revoked session and signs the user out.
    if (!payload.sub || !payload.sid) {
      return null;
    }
    const user = await this.authService.findUserBySession(
      payload.sub,
      payload.sid,
    );
    if (!user) return null;
    // The session id lets a request act on "this device" (e.g. keep it
    // signed in when the password changes).
    return { ...user, sessionId: payload.sid };
  }
}
