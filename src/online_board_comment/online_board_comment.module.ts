import { Module } from '@nestjs/common';
import { OnlineBoardCommentService } from './online_board_comment.service';
import { OnlineBoardCommentController } from './online_board_comment.controller';
import { OnlineBoardComments } from './entities/online_board_comment.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { UserInfos } from '../users/entities/user-info.entity';
import { OnlineBoardsService } from '../online_boards/online_boards.service';
import { BoardIdValidationPipe } from '../online_boards/pipes/exist-board.pipe';
import { S3Module } from '../s3/s3.module';
import { OnlineBoardsModule } from '../online_boards/online_boards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OnlineBoardComments, OnlineBoards, UserInfos]),
    UsersModule,
    S3Module, // 얘를 추가를 안하면 에러가 나는 기이한 상황임
  ],
  controllers: [OnlineBoardCommentController],
  providers: [
    OnlineBoardCommentService,
    OnlineBoardsService,
    BoardIdValidationPipe,
  ],
})
export class OnlineBoardCommentModule {}
