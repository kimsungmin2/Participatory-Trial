import { Module } from '@nestjs/common';
import { HumorsService } from './humors.service';
import { HumorsController } from './humors.controller';
import { HumorBoards } from './entities/humor-board.entity';
import { HumorComments } from '../humor-comments/entities/humor_comment.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../users/entities/user.entity';
import { S3Module } from '../s3/s3.module';
import { LikeModule } from '../like/like.module';
import { SearchModule } from '../search/search.module';
import { HumorsHallOfFame } from './entities/humor_hall_of_fame.entity';
import { HumorsLikeHallOfFames } from './entities/humor_hall_of_fame.like.entity';
import { HumorsViewHallOfFames } from './entities/humor_hall_of_fame.view.entity';
import { HumorHallOfFameService } from './hall_of_fameOfHumor';
import { HumorVotes } from './entities/HumorVote.entity';
import { EachHumorVote } from './entities/UservoteOfHumorVote.entity';
import { HumorsVotesModule } from '../humors_votes/humors_votes.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HumorBoards,
      HumorVotes,
      HumorComments,
      Users,
      HumorsHallOfFame,
      EachHumorVote,
      HumorsLikeHallOfFames,
      HumorsViewHallOfFames,
      EachHumorVote,
    ]),
    S3Module,
    LikeModule,
    SearchModule,
    HumorsVotesModule,
    UsersModule,
  ],
  controllers: [HumorsController],
  providers: [HumorsService, HumorHallOfFameService],
  exports: [HumorsService],
})
export class HumorsModule {}
