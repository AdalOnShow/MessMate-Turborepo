import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

interface GoogleProfileJson {
  email_verified?: boolean;
  email?: string;
  sub?: string;
  name?: string;
  picture?: string;
}

interface GoogleProfile {
  id: string;
  emails?: { value: string }[];
  displayName?: string;
  photos?: { value: string }[];
  _json?: GoogleProfileJson;
}

type ValidatedUser =
  | { id: string; email: string; name: string; system_role: unknown }
  | { error: string; message: string };

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value ?? profile._json?.email;
    const name = profile.displayName ?? profile._json?.name ?? '';
    const avatar = profile.photos?.[0]?.value ?? profile._json?.picture ?? null;
    const emailVerified = profile._json?.email_verified ?? false;

    if (!email) {
      this.logger.warn('❌ Google OAuth: No email found in profile');
      return done(null, {
        error: 'NO_EMAIL',
        message: 'No email found in Google profile',
      } as ValidatedUser);
    }

    if (!emailVerified) {
      this.logger.warn(`❌ Google OAuth: Email not verified for ${email}`);
      return done(null, {
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Google email is not verified',
      } as ValidatedUser);
    }

    this.logger.log(`🔐 Google OAuth validation for: ${email}`);

    try {
      const user = await this.authService.findOrCreateGoogleUser({
        googleId: profile.id,
        email,
        name,
        avatar,
      });

      this.logger.log(`✅ Google OAuth user resolved: ${user.id} (${email})`);
      return done(null, user);
    } catch (error) {
      this.logger.error(
        `❌ Google OAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (error instanceof Error && error.message.includes('already exists')) {
        return done(null, {
          error: 'ACCOUNT_EXISTS',
          message: error.message,
        } as ValidatedUser);
      }
      return done(error as Error, undefined);
    }
  }
}
