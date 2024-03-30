import { Module } from '@nestjs/common';
import { TrialsService } from './trials.service';
import { TrialsController } from './trials.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trials } from './entities/trial.entity';
import { HttpModule } from '@nestjs/axios';
import { PanryeInfo } from './entities/panryedata.entity';
import { BullModule } from '@nestjs/bull';
import { VoteModule } from './vote/vote.module';

@Module({
  imports: [TypeOrmModule.forFeature([Trials, PanryeInfo]),
  HttpModule,
  BullModule.registerQueue({
    name: 'trial-queue'
  }),
  VoteModule,],
  controllers: [TrialsController],
  providers: [TrialsService],
})
export class TrialsModule {}
