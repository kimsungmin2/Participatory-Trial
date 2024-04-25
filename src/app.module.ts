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
import { Users } from './users/entities/user.entity';
import { UserInfos } from './users/entities/user-info.entity';
import { Trials } from './trials/entities/trial.entity';
import { Votes } from './trials/entities/vote.entity';
import { OnlineBoards } from './online_boards/entities/online_board.entity';
import { PolticalDebateBoards } from './poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateComments } from './poltical_debates/entities/poltical_debate_comments.entity';
import { BullModule } from '@nestjs/bull';
import { VoteModule } from './trials/vote/vote.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { EventsModule } from './events/events.module';
import { ChatsModule } from './chats/chats.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { RedisModule } from './cache/redis.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ServerApiVersion } from 'mongodb';
// import { CacheConfigService } from './cache/config';
// import { RedisIoAdapter } from './cache/redis.adpter';
// import { CacheConfigService } from './cache/cache.config';
import { AlarmModule } from './alarm/alarm.module';
import { HumorCommentsModule } from './humor-comments/humor-comments.module';
import { OnlineBoardCommentModule } from './online_board_comment/online_board_comment.module';
import { WinstonModule } from 'nest-winston/dist/winston.module';
import { SearchModule } from './search/search.module';
import { LikeModule } from './like/like.module';
import { S3Module } from './s3/s3.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { CacheConfigService } from './cache/cache.config';

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
        // DB_SLAVE_HOST: Joi.string().required(),
        // DB_SLAVE_USERNAME: Joi.string().required(),
        // DB_SLAVE_PASSWORD: Joi.string().required(),
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }), // `public` 폴더가 프로젝트 루트에 위치한다고 가정
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
    RedisModule,
    EventsModule,
    ChatsModule,
    AlarmModule,
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
