// import { Strategy, ExtractJwt } from 'passport-jwt';
// import { PassportStrategy } from '@nestjs/passport';
// import { Request as RequestType } from 'express';
// import {
//   Injectable,
//   UnauthorizedException,
//   BadRequestException,
// } from '@nestjs/common';
// import { UsersService } from '../../users/users.service';
// import { ConfigService } from '@nestjs/config';
// import { v4 as uuidv4 } from 'uuid';
// import { IGuestRequest } from '../interface/guest.interface';

// @Injectable()
// export class JwtOptionalStrategy extends PassportStrategy(
//   Strategy,
//   'jwt-optional',
// ) {
//   constructor(
//     private readonly userService: UsersService,
//     private readonly configService: ConfigService,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromExtractors([
//         (req) => JwtOptionalStrategy.extractJWT(req),
//       ]),
//       ignoreExpiration: false,
//       secretOrKey: configService.get<string>('JWT_SECRET_KEY'),
//       passReqToCallback: true,
//     });
//   }

//   private static extractJWT(req: RequestType): string | null {
//     const { authorization } = req.cookies;

//     if (authorization) {
//       const [tokenType, token] = authorization.split(' ');
//       if (tokenType !== 'Bearer')
//         throw new BadRequestException('토큰 타입이 일치하지 않습니다.');
//       if (token) {
//         return token;
//       }
//     }
//     console.log(123);
//     return null;
//   }

//   async validate(req: RequestType, payload: any) {
//     const request = req as IGuestRequest; // Request 객체를 IGuestRequest로 캐스팅
//     console.log(1);
//     if (!payload && !req.cookies.authorization) {
//       request.guest = { isGuest: true, id: uuidv4() }; // guest 정보 추가
//       console.log(request.guest);
//       return request.guest; // 게스트 정보 반환
//     }
//     if (!payload || !payload.sub) {
//       throw new UnauthorizedException('토큰이 유효하지 않습니다.');
//     }
//     const user = await this.userService.findById(payload.sub);
//     if (!user) {
//       throw new UnauthorizedException('해당하는 사용자를 찾을 수 없습니다.');
//     }
//     console.log(2);
//     return user; // 인증된 사용자 정보 반환
//   }
// }
