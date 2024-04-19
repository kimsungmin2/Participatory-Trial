import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const socket = context.switchToWs().getClient();
    const cookies = socket.handshake.headers.cookie;
    console.log(socket.handshake);
    if (!cookies) {
      console.log('왜안되냐고');
      throw new WsException('인증되지않음');
    }
    console.log(3);

    const authToken = this.parseCookie(cookies, 'authorization');

    if (!authToken) {
      throw new WsException('인증 토큰이 없음');
    }

    const rawToken = authToken.split('Bearer%20')[1];

    if (!rawToken) {
      throw new WsException('인증 토큰 형식이 잘못됨');
    }
    try {
      const decoded = jwt.verify(
        rawToken,
        this.configService.get<string>('JWT_SECRET_KEY'),
      );

      socket.userId = decoded['sub'];

      return true;
    } catch (error) {
      throw new WsException('인증 실패');
    }
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
