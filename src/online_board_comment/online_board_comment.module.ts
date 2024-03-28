import { Module } from '@nestjs/common';
import { OnlineBoardCommentService } from './online_board_comment.service';
import { OnlineBoardCommentController } from './online_board_comment.controller';

@Module({
  controllers: [OnlineBoardCommentController],
  providers: [OnlineBoardCommentService],
})
export class OnlineBoardCommentModule {}
