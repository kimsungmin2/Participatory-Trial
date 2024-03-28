import { Module } from '@nestjs/common';
import { TrialsService } from './trials.service';
import { TrialsController } from './trials.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trials } from './entities/trial.entity';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [TypeOrmModule.forFeature([Trials]), HttpModule],
  controllers: [TrialsController],
  providers: [TrialsService],
})
export class TrialsModule {}
