import { Module } from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { OnlineBoardsController } from './online_boards.controller';
import { Users } from '../users/entities/user.entity';
import { OnlineBoardComments } from '../online_board_comment/entities/online_board_comment.entity';
import { OnlineBoards } from './entities/online_board.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
<<<<<<< HEAD
import { LikeModule } from 'src/like/like.module';
import { OnlineBoardLike } from './entities/online_board_like.entity';
import { OnlineBoardLikeHallOfFames } from './entities/online_boardLike_of_fame.entity';
import { OnlineBoardViewHallOfFames } from './entities/online_boardVIew_of_fame.entity';
import { OnlineBoardHallOfFameService } from './online_boards.hollofFame.service';

@Module({
  imports: [TypeOrmModule.forFeature([OnlineBoards, Users, OnlineBoardLike,OnlineBoardLikeHallOfFames, OnlineBoardViewHallOfFames])
  , UsersModule,
  LikeModule],
=======
import { OnlineBoardLike } from './entities/online_board_like.entity';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OnlineBoards,
      Users,
      OnlineBoardComments,
      OnlineBoardLike,
    ]),
    UsersModule,
    S3Module,
  ],
>>>>>>> 34602244a3eebb81cb9e123a3922b52e3fb21519
  controllers: [OnlineBoardsController],
  providers: [OnlineBoardsService, OnlineBoardHallOfFameService],
})
export class OnlineBoardsModule {}
