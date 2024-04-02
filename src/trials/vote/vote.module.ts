import { Module } from '@nestjs/common';
import { VotesController } from './vote.controller';
import { VotesService } from './vote.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trials } from '../entities/trial.entity';
import { PanryeInfo } from '../entities/panryedata.entity';
import { EachVote } from '../entities/Uservote.entity';
import { Votes } from '../entities/vote.entity';


@Module({
  imports: [TypeOrmModule.forFeature([Trials, PanryeInfo, EachVote, Votes])],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VoteModule {}
