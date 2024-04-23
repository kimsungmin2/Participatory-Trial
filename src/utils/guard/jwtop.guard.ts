import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtOpAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const Request = context.switchToWs().getClient();

    const cookies = Request.res.req.headers.cookie;
    if (cookies) {
      const authToken = this.parseCookie(cookies, 'authorization');

      if (authToken) {
        const rawToken = authToken.split('Bearer%20')[1];
        if (rawToken) {
          try {
            const decoded = jwt.verify(
              rawToken,
              this.configService.get<string>('JWT_SECRET_KEY'),
            );
            Request.id = decoded['sub'];

            return true;
          } catch (error) {
            console.error('인증 실패:', error);

            return false;
          }
        }
      }
    }
    return true;
  }

  private parseCookie(cookies: string, name: string): string | null {
    const nameEQ = name + '=';
    const ca = cookies.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
}
