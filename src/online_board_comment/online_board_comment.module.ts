import { Module } from '@nestjs/common';
import { OnlineBoardCommentService } from './online_board_comment.service';
import { OnlineBoardCommentController } from './online_board_comment.controller';
import { OnlineBoardComments } from './entities/online_board_comment.entity';
import { OnlineBoards } from 'src/online_boards/entities/online_board.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([OnlineBoardComments, OnlineBoards])],
  controllers: [OnlineBoardCommentController],
  providers: [OnlineBoardCommentService],
})
export class OnlineBoardCommentModule {}
