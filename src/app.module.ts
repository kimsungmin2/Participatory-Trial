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
<<<<<<< HEAD
import { OnlineBoardCommentController } from './online_boards/online_board_comment.controller';
import { OnlineBoardCommentService } from './online_boards/online_board_comment.service';
import { OnlineBoardCommentModule } from './online_board_comment/online_board_comment.module';
import Joi from 'joi';
=======
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { Users } from './users/entities/user.entity';
import { UserInfos } from './users/entities/user-info.entity';
import { Trials } from './trials/entities/trial.entity';
import { Votes } from './trials/entities/vote.entity';
import { OnlineBoardComments } from './online_boards/entities/online_board_comment.entity';
import { OnlineBoards } from './online_boards/entities/online_board.entity';
import { HumorComments } from './humors/entities/humor_comment.entity';
import { HumorBoards } from './humors/entities/humor.entity';
import { PolticalDebateBoards } from './poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateComments } from './poltical_debates/entities/poltical_debate_comments.entity';
>>>>>>> feat/Users

export const typeOrmModuleOptions = {
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => ({
    type: 'postgres',
    host: configService.get<string>('DB_HOST'),
<<<<<<< HEAD
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: configService.get<boolean>('DB_SYNC'),
    logging: false,
=======
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_NAME'),
    // autoLoadEntities: true, // entity를 등록하지 않아도 자동적으로 불러온다.
    entities: [
      Users,
      UserInfos,
      Trials,
      Votes,
      OnlineBoardComments,
      OnlineBoards,
      HumorComments,
      HumorBoards,
      PolticalDebateBoards,
      PolticalDebateComments,
    ],
    synchronize: configService.get('DB_SYNC'),
    logging: true, // DB에서 query가 발생할때마다 rawquery가 출력된다.
>>>>>>> feat/Users
  }),
  inject: [ConfigService],
};
console.log(Joi.object);
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
    TypeOrmModule.forRootAsync(typeOrmModuleOptions),
    UsersModule,
    OnlineBoardsModule,
    TrialsModule,
    HumorsModule,
    PolticalDebatesModule,
<<<<<<< HEAD
    OnlineBoardCommentModule,
=======
    AuthModule,
    EmailModule,
>>>>>>> feat/Users
  ],
  controllers: [AppController, OnlineBoardCommentController],
  providers: [AppService, OnlineBoardCommentService],
})
export class AppModule {}
