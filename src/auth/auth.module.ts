import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';


import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';



import { JwtStrategy } from 'src/users/utils/strategy/jwt.strategy';
import { NaverStrategy } from 'src/users/utils/strategy/naver.strategy';
import { UsersModule } from 'src/users/users.module';
import { Users } from 'src/users/entities/user.entity';
import { KakaoStrategy } from 'src/users/utils/strategy/kakao.strategy';


@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Users]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, KakaoStrategy, NaverStrategy, JwtStrategy],
})
export class AuthModule {}
