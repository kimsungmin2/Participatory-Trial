import { Module } from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { OnlineBoardsController } from './online_boards.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../users/entities/user.entity';
import { OnlineBoards } from './entities/online_board.entity';
import { UsersModule } from 'src/users/users.module';
import { LikeModule } from 'src/like/like.module';
import { OnlineBoardLike } from './entities/online_board_like.entity';
import { OnlineBoardLikeHallOfFames } from './entities/online_boardLike_of_fame.entity';
import { OnlineBoardViewHallOfFames } from './entities/online_boardVIew_of_fame.entity';
import { OnlineBoardHallOfFameService } from './online_boards.hollofFame.service';

@Module({
  imports: [TypeOrmModule.forFeature([OnlineBoards, Users, OnlineBoardLike,OnlineBoardLikeHallOfFames, OnlineBoardViewHallOfFames])
  , UsersModule,
  LikeModule],
  controllers: [OnlineBoardsController],
  providers: [OnlineBoardsService, OnlineBoardHallOfFameService],
})
export class OnlineBoardsModule {}
