import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Users } from '../users/entities/user.entity';
import { KakaoStrategy } from '../utils/strategy/kakao.strategy';
import { NaverStrategy } from '../utils/strategy/naver.strategy';
import { JwtStrategy } from '../utils/strategy/jwt.strategy';
import { UserInfos } from '../users/entities/user-info.entity';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { GoogleStrategy } from '../utils/strategy/google.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Users, UserInfos]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    KakaoStrategy,
    NaverStrategy,
    JwtStrategy,
    UsersService,
    EmailService,
    GoogleStrategy,
  ],
})
export class AuthModule {}
