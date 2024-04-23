import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
// import { LikeController } from './like.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { HumorComments } from '../humor-comments/entities/humor_comment.entity';
import { Users } from '../users/entities/user.entity';
import { HumorLike } from '../humors/entities/humor_like.entity';
import { OnlineBoardLike } from '../online_boards/entities/online_board_like.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { Trials } from '../trials/entities/trial.entity';
import { TrialLike } from '../trials/entities/trials.like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HumorBoards,
      HumorLike,
      OnlineBoardLike,
      OnlineBoards,
      Trials,
      TrialLike,
    ]),
  ],
  controllers: [],
  providers: [LikeService],
  exports: [LikeService],
})
export class LikeModule {}
