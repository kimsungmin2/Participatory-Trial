import { Module } from '@nestjs/common';
import { OnlineBoardCommentService } from './online_board_comment.service';
import { OnlineBoardCommentController } from './online_board_comment.controller';
import { OnlineBoardComments } from './entities/online_board_comment.entity';
import { OnlineBoards } from 'src/online_boards/entities/online_board.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnlineBoardsModule } from 'src/online_boards/online_boards.module';
import { UsersModule } from 'src/users/users.module';
import { OnlineBoardsService } from '../online_boards/online_boards.service';
import { S3Module } from '../s3/s3.module';

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
