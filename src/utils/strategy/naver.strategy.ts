import { Strategy, Profile } from 'passport-naver';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
// import { AuthService } from '../../auth/auth.service';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {
    super({
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_SECRET,
      callbackURL: process.env.NAVER_REDIRECT_URI,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: any,
  ) {
    try {
      const email = profile._json.email;
      const nickName = profile._json.nickname;
      const provider = 'naver';

      let user = await this.userService.findByEmail(email);
      if (!user) {
        user = await this.authService.createProviderUser(
          email,
          nickName,
          provider,
        );
      }

      const token = await this.authService.createToken(email);
      const accessToken = token.accessToken;

      done(null, { accessToken });
    } catch (error) {
      console.error('인증 처리 중 오류 발생:', error);
      done(error, false);
    }
  }
}
