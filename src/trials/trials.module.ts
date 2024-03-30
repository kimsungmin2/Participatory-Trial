import { Module } from '@nestjs/common';
import { TrialsService } from './trials.service';
import { TrialsController } from './trials.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trials } from './entities/trial.entity';
import { HttpModule } from '@nestjs/axios';
// import { TrialsCommentsModule } from './trials_comments/trials_comments.module';
import { PanryeInfo } from './entities/panryedata.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trials, PanryeInfo]), HttpModule],
  controllers: [TrialsController],
  providers: [TrialsService],
})
export class TrialsModule {}
