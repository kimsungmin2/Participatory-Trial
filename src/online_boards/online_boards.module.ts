import { Module } from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { OnlineBoardsController } from './online_boards.controller';
import { Users } from '../users/entities/user.entity';
import { OnlineBoardComments } from '../online_board_comment/entities/online_board_comment.entity';
import { OnlineBoards } from './entities/online_board.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { OnlineBoardLike } from './entities/online_board_like.entity';
import { S3Module } from '../s3/s3.module';
import { UserInfos } from '../users/entities/user-info.entity';
import { S3Service } from '../s3/s3.service';
import { BoardOwnerGuard } from './guards/online_boards.guard';
import { BoardIdValidationPipe } from './pipes/exist-board.pipe';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OnlineBoards,
      Users,
      UserInfos,
      OnlineBoardComments,
      OnlineBoardLike,
    ]),
    UsersModule,
    S3Module,
  ],
  controllers: [OnlineBoardsController],
  providers: [
    OnlineBoardsService,
    BoardOwnerGuard,
    BoardIdValidationPipe,
    S3Service,
  ],
  exports: [BoardIdValidationPipe, BoardOwnerGuard],
})
export class OnlineBoardsModule {}
