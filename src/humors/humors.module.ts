import { Module } from '@nestjs/common';
import { HumorsService } from './humors.service';
import { HumorsController } from './humors.controller';
import { HumorBoards } from './entities/humor-board.entity';
import { HumorComments } from '../humor-comments/entities/humor_comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HumorBoards, HumorComments, Users])],
  controllers: [HumorsController],
  providers: [HumorsService],
})
export class HumorsModule {}
