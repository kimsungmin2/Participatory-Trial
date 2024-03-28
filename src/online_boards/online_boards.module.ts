import { Module } from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { OnlineBoardsController } from './online_boards.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../users/entities/user.entity';
import { OnlineBoardComments } from './entities/online_board_comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Users, OnlineBoardComments])],
  controllers: [OnlineBoardsController],
  providers: [OnlineBoardsService],
})
export class OnlineBoardsModule {}
