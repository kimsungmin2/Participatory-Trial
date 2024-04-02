import { Strategy, Profile } from 'passport-google-oauth20';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any,
  ) {
    try {
      const email = profile.emails[0].value;
      const nickName = profile.displayName;
      const provider = 'google';

      let user = await this.userService.findByEmail(email);
      if (!user) {
        user = await this.authService.createProviderUser(
          email,
          nickName,
          provider,
        );
      }

      const token = await this.authService.createToken(email);
      done(null, {
        accessToken: token.accessToken,
      });
    } catch (error) {
      console.error('인증 처리 중 오류 발생:', error);
      done(error, false);
    }
  }
}
