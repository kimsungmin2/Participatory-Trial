import { Module } from '@nestjs/common';
import { HumorVotesController } from './humors_votes.controller';
import { HumorVotesService } from './humors_votes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HumorBoards } from '../entities/humor-board.entity';
import { EachHumorVote } from '../entities/UservoteOfHumorVote.entity';
import { HumorVotes } from '../entities/HumorVote.entity';


@Module({
  imports: [TypeOrmModule.forFeature([HumorBoards, EachHumorVote, HumorVotes])],
  controllers: [HumorVotesController],
  providers: [HumorVotesService],
})
export class HumorsVotesModule {}
