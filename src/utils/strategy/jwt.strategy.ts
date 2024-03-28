import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Request as RequestType } from 'express';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import * as _ from 'lodash';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([JwtStrategy.extractJWT]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY,
    });
  }

  private static extractJWT(req: RequestType): string | null {
    const { authorization } = req.cookies;
    if (authorization) {
      const [tokenType, token] = authorization.split(' ');
      if (tokenType !== 'Bearer')
        throw new BadRequestException('토큰 타입이 일치하지 않습니다.');
      if (token) {
        return token;
      }
    }
    return null;
  }

  async validate(payload: any) {
    const user = await this.userService.findByEmail(payload.email);
    if (_.isNil(user)) {
      throw new NotFoundException('해당하는 사용자를 찾을 수 없습니다.');
    }

    return user;
  }
}
