import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OptionalWsJwtGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const socket = context.switchToWs().getClient();
    const cookies = socket.handshake.headers.cookie;

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
            socket.userId = decoded['sub'];

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
