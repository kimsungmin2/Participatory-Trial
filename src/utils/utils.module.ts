import { Module } from '@nestjs/common';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { Trials } from '../trials/entities/trial.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HumorsService } from '../humors/humors.service';
import { TrialsService } from '../trials/trials.service';
import { HumorsModule } from '../humors/humors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HumorBoards, Trials]),
    HumorsModule,
    TrialsModule,
  ],
})
export class TrialsModule {}
