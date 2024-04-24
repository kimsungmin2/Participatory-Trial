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
import { EmailModule } from '../email/email.module';
import { BullModule } from '@nestjs/bull';
import { RedisModule } from '../cache/redis.module';
import { Clients } from '../users/entities/client.entity';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
    TypeOrmModule.forFeature([Users, UserInfos, Clients]),
    UsersModule,
    EmailModule,
    RedisModule,
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
