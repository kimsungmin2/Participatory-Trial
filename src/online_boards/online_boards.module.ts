import { Module } from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { OnlineBoardsController } from './online_boards.controller';
import { Users } from '../users/entities/user.entity';
import { OnlineBoardComments } from '../online_board_comment/entities/online_board_comment.entity';
import { OnlineBoards } from './entities/online_board.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';
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
  controllers: [OnlineBoardsController],
  providers: [OnlineBoardsService],
})
export class OnlineBoardsModule {}
