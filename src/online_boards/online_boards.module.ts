import { Module } from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { OnlineBoardsController } from './online_boards.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../users/entities/user.entity';
import { OnlineBoardComments } from './entities/online_board_comment.entity';
import { OnlineBoards } from './entities/online_board.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([OnlineBoards, Users]), UsersModule],
  controllers: [OnlineBoardsController],
  providers: [OnlineBoardsService],
})
export class OnlineBoardsModule {}
