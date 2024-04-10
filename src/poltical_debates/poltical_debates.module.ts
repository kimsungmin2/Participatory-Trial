import { Module } from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { PolticalDebatesController } from './poltical_debates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolticalDebateCommentsService } from './poltical_debate_comments.service';
import { PolticalDebateBoards } from './entities/poltical_debate.entity';
import { PolticalDebateComments } from './entities/poltical_debate_comments.entity';
import { PolticalDebateCommentsController } from './poltical_debate_comments.controller';
import { PolticalDebateHallOfFame } from './entities/poltical_hall_of_fame.entity';
import { PolticalDebateBoardsViewHallOfFames } from './entities/polticalView_hall_of_fame.entity';
import { PolticalDebateVotes } from './entities/polticalVote.entity';
import { EachPolticalVote } from './entities/userVoteOfPoltical_debate.entity';
import { PolticalDabateHallOfFameService } from './politcal_debate_hall_of_fame.service';
import { PolticalDebatesVoteModule } from './poltical_debates_vote/poltical_debates_vote.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PolticalDebateBoards, PolticalDebateComments, PolticalDebateHallOfFame, PolticalDebateBoardsViewHallOfFames, PolticalDebateVotes, EachPolticalVote]),
    PolticalDebatesVoteModule,
    S3Module
  ],
  controllers: [PolticalDebatesController, PolticalDebateCommentsController],
  providers: [PolticalDebatesService, PolticalDebateCommentsService, PolticalDabateHallOfFameService],
})
export class PolticalDebatesModule {}
