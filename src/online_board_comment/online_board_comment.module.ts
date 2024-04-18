import { Module } from '@nestjs/common';
import { OnlineBoardCommentService } from './online_board_comment.service';
import { OnlineBoardCommentController } from './online_board_comment.controller';
import { OnlineBoardComments } from './entities/online_board_comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnlineBoardsService } from '../online_boards/online_boards.service';
import { S3Module } from '../s3/s3.module';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { UsersModule } from '../users/users.module';
import { OnlineBoardsModule } from '../online_boards/online_boards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OnlineBoardComments, OnlineBoards]),
    OnlineBoardsModule,
    UsersModule,
    S3Module,
  ],
  controllers: [OnlineBoardCommentController],
  providers: [OnlineBoardCommentService, OnlineBoardsService],
})
export class OnlineBoardCommentModule {}
