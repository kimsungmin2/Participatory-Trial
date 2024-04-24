import { Module } from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { OnlineBoardsController } from './online_boards.controller';
import { Users } from '../users/entities/user.entity';
import { OnlineBoards } from './entities/online_board.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnlineBoardLike } from './entities/online_board_like.entity';
import { OnlineBoardLikeHallOfFames } from './entities/online_boardLike_of_fame.entity';
import { OnlineBoardViewHallOfFames } from './entities/online_boardVIew_of_fame.entity';
import { OnlineBoardHallOfFameService } from './online_boards.hollofFame.service';
import { S3Module } from 'src/s3/s3.module';
import { BoardOwnerGuard } from './guards/online_boards.guard';
import { BoardIdValidationPipe } from './pipes/exist-board.pipe';
import { S3Service } from '../s3/s3.service';
import { UsersModule } from '../users/users.module';
import { LikeModule } from '../like/like.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OnlineBoards,
      Users,
      OnlineBoardLike,
      OnlineBoardLikeHallOfFames,
      OnlineBoardViewHallOfFames,
    ]),
    UsersModule,
    LikeModule,
    S3Module,
  ],
  controllers: [OnlineBoardsController],
  providers: [
    OnlineBoardsService,
    OnlineBoardHallOfFameService,
    BoardOwnerGuard,
    BoardIdValidationPipe,
    S3Service,
  ],
  exports: [BoardIdValidationPipe, BoardOwnerGuard],
})
export class OnlineBoardsModule {}
