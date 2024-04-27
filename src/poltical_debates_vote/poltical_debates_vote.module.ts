import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
import { EachPolticalVote } from '../poltical_debates/entities/userVoteOfPoltical_debate.entity';
import { PolticalDebateVotes } from '../poltical_debates/entities/polticalVote.entity';
import { PolticalVotesController } from './poltical_debates_vote.controller';
import { PolticalVotesService } from './poltical_debates_vote.service';
import { PanryeInfo } from '../trials/entities/panryedata.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PolticalDebateBoards,
      PanryeInfo,
      EachPolticalVote,
      PolticalDebateVotes,
    ]),
  ],
  controllers: [PolticalVotesController],
  providers: [PolticalVotesService],
  exports: [PolticalVotesService],
})
export class PolticalDebatesVoteModule {}
