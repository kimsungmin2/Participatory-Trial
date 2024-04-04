import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { OnlineBoardsModule } from './online_boards/online_boards.module';
import { TrialsModule } from './trials/trials.module';
import { HumorsModule } from './humors/humors.module';
import { PolticalDebatesModule } from './poltical_debates/poltical_debates.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { OnlineBoardCommentModule } from './online_board_comment/online_board_comment.module';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { HumorCommentsModule } from './humor-comments/humor-comments.module';
import { S3Module } from './s3/s3.module';
import { LikeModule } from './like/like.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BullModule } from '@nestjs/bull';
import { VoteModule } from './trials/vote/vote.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@nestjs-modules/ioredis';
import { CacheConfigService } from './cache/config';
import { CacheModule } from '@nestjs/cache-manager';
import { WinstonModule } from 'nest-winston';

console.log(1, process.env.DB_NAME);
export const typeOrmModuleOptions = {
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: configService.get('DB_SYNC'),
    logging: true, // DB에서 query가 발생할때마다 rawquery가 출력된다.
  }),
  inject: [ConfigService],
};
console.log(typeOrmModuleOptions);
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.IS_TEST === 'true' ? `.env.test` : `.env`,
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DB_SYNC: Joi.boolean().required(),
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // `public` 폴더가 프로젝트 루트에 위치한다고 가정
    }),
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: process.env.REDIS_URL,
      }),
    }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync({
      isGlobal: true,
      useClass: CacheConfigService,
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    UsersModule,
    OnlineBoardsModule,
    TrialsModule,
    HumorsModule,
    PolticalDebatesModule,
    HumorCommentsModule,
    AuthModule,
    EmailModule,
    S3Module,
    LikeModule,
    SchedulerModule,
    AuthModule,
    EmailModule,
    VoteModule,
    OnlineBoardCommentModule,
    WinstonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
