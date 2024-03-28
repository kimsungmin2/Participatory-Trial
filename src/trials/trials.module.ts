import { Module } from '@nestjs/common';
import { TrialsService } from './trials.service';
import { TrialsController } from './trials.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trials } from './entities/trial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trials])],
  controllers: [TrialsController],
  providers: [TrialsService],
})
export class TrialsModule {}
