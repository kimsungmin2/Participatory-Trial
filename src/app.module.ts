import { CacheConfigService } from './cache/cache.config';
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
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { HumorCommentsModule } from './humor-comments/humor-comments.module';
import { S3Module } from './s3/s3.module';
import { LikeModule } from './like/like.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './scheduler/scheduler.module';
import { CacheModule } from '@nestjs/cache-manager';
import { HumorsService } from './humors/humors.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BullModule } from '@nestjs/bull';
import { VoteModule } from './trials/vote/vote.module';
import { WinstonModule } from "nest-winston"
import { APP_INTERCEPTOR } from '@nestjs/core';
import { HttpLoggingInterceptor } from './utils/interceptor/logging/access.logging.interceptor';
import { ErrorInterceptor } from './utils/interceptor/logging/error.logging.interceptor';
import { OnlineBoardCommentModule } from './online_board_comment/online_board_comment.module';


export const typeOrmModuleOptions = {
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    // autoLoadEntities: true, // entity를 등록하지 않아도 자동적으로 불러온다.
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: configService.get('DB_SYNC'),
    logging: true, // DB에서 query가 발생할때마다 rawquery가 출력된다.
  }),
  inject: [ConfigService],
};

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // `public` 폴더가 프로젝트 루트에 위치한다고 가정
    }),
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
    CacheModule.registerAsync({
      isGlobal: true,
      useClass: CacheConfigService,
    }),

    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: process.env.REDIS_URL,
        options: {},
      }),
    }),
    ScheduleModule.forRoot(),
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
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: ErrorInterceptor,
    // },
  ],
})
export class AppModule {}
