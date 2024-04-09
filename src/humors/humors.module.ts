import { Module } from '@nestjs/common';
import { HumorsService } from './humors.service';
import { HumorsController } from './humors.controller';
import { HumorBoards } from './entities/humor-board.entity';
import { HumorComments } from '../humor-comments/entities/humor_comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../users/entities/user.entity';
import { S3Module } from '../s3/s3.module';
import { LikeModule } from '../like/like.module';
import { TrialsModule } from '../trials/trials.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HumorBoards, HumorComments, Users]),
    S3Module,
    LikeModule,
    SearchModule,
  ],
  controllers: [HumorsController],
  providers: [HumorsService],
  exports: [HumorsService],
})
export class HumorsModule {}
