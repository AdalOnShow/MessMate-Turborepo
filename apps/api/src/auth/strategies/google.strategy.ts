import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

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
    profile: {
      id: string;
      emails?: { value: string }[];
      displayName?: string;
      photos?: { value: string }[];
    },
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    const name = profile.displayName || '';
    const avatar = profile.photos?.[0]?.value || null;

    if (!email) {
      this.logger.warn('❌ Google OAuth: No email found in profile');
      return done(new Error('No email found in Google profile'), undefined);
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
      return done(error as Error, undefined);
    }
  }
}
