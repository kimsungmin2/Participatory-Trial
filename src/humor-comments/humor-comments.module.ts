import { Module } from '@nestjs/common';
import { HumorCommentsService } from './humor-comments.service';
import { HumorCommentsController } from './humor-comments.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HumorComments } from './entities/humor_comment.entity';
import { HumorBoards } from '../humors/entities/humor-board.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HumorComments, HumorBoards])],
  controllers: [HumorCommentsController],
  providers: [HumorCommentsService],
})
export class HumorCommentsModule {}
