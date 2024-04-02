import { Module } from '@nestjs/common';
import { TrialsService } from './trials.service';
import { TrialsController } from './trials.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trials } from './entities/trial.entity';
import { HttpModule } from '@nestjs/axios';
import { PanryeInfo } from './entities/panryedata.entity';
import { BullModule } from '@nestjs/bull';
import { VoteModule } from './vote/vote.module';
import { EachVote } from './entities/Uservote.entity';
import { Votes } from './entities/vote.entity';
import { TrialHallOfFames } from './entities/trial_hall_of_fame.entity';
import { TrialLikeHallOfFames } from './entities/trail_hall_of_fame.like.entity';
import { TrialViewHallOfFames } from './entities/trial_hall_of_fame.view.entity';
import { TrialHallOfFameService } from './trial_hall_of_fame.service';
import { LikeModule } from 'src/like/like.module';
import { TrialsProcessor } from './trialQueue/trialQueue';

@Module({
  imports: [TypeOrmModule.forFeature([Trials, PanryeInfo, EachVote, Votes,TrialHallOfFames, TrialLikeHallOfFames, TrialViewHallOfFames]),
  HttpModule,
  BullModule.registerQueue({
    name: 'trial-queue'
  }),
  VoteModule,
  LikeModule],
  controllers: [TrialsController],
  providers: [TrialsService, TrialHallOfFameService, TrialsProcessor],
})
export class TrialsModule {}
