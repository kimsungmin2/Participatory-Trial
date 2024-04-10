import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolticalDebateBoards } from '../entities/poltical_debate.entity';
import { PanryeInfo } from 'src/trials/entities/panryedata.entity';
import { EachPolticalVote } from '../entities/userVoteOfPoltical_debate.entity';
import { PolticalDebateVotes } from '../entities/polticalVote.entity';
import { PolticalVotesController } from './poltical_debates_vote.controller';
import { PolticalVotesService } from './poltical_debates_vote.service';

@Module({
  imports: [TypeOrmModule.forFeature([PolticalDebateBoards, PanryeInfo, EachPolticalVote, PolticalDebateVotes])],
  controllers: [PolticalVotesController],
  providers: [PolticalVotesService],
})
export class PolticalDebatesVoteModule {}