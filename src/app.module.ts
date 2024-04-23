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
import { SchedulerModule } from './scheduler/scheduler.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BullModule } from '@nestjs/bull';
import { VoteModule } from './trials/vote/vote.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EventsModule } from './events/events.module';
import { ChatsModule } from './chats/chats.module';
import { WinstonModule } from 'nest-winston';
import { APP_INTERCEPTOR } from '@nestjs/core';
// import { HttpLoggingInterceptor } from './utils/interceptor/logging/http.logging.interceptor';
import { SearchModule } from './search/search.module';
import { OnlineBoardCommentModule } from './online_board_comment/online_board_comment.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ServerApiVersion } from 'mongodb';
console.log(__dirname);
export const typeOrmModuleOptions = {
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => ({
    type: 'postgres',
    replication: {
      master: {
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
      },
      slaves: [
        {
          host: configService.get<string>('DB_SLAVE_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get('DB_SLAVE_USERNAME'),
          password: configService.get('DB_SLAVE_PASSWORD'),
          database: configService.get('DB_SLAVE_NAME'),
        },
      ],
    },
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: configService.get('DB_SYNC'),
    logging: true, // DB에서 query가 발생할때마다 rawquery가 출력된다.
    retryAttempts: 5,
    retryDelay: 2000,
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
        DB_SLAVE_HOST: Joi.string().required(),
        DB_SLAVE_USERNAME: Joi.string().required(),
        DB_SLAVE_PASSWORD: Joi.string().required(),
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // `public` 폴더가 프로젝트 루트에 위치한다고 가정
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // `public` 폴더가 프로젝트 루트에 위치한다고 가정
    }),
    RedisModule.forRootAsync({
      useFactory: () => ({
        type: 'single',
        url: process.env.REDIS_URL,
        options: {},
      }),
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI, {
      serverApi: ServerApiVersion.v1,
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
    EventsModule,
    ChatsModule,
    OnlineBoardCommentModule,
    WinstonModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: HttpLoggingInterceptor,
    // },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: ErrorInterceptor,
    // },
  ],
})
export class AppModule {}
