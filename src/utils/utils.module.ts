import { Module } from '@nestjs/common';
import { Trials } from '../trials/entities/trial.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HumorsModule } from '../humors/humors.module';
// import { HumorBoards } from '../humors/entities/humor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Trials]), HumorsModule, TrialsModule],
})
export class TrialsModule {}
