import { Module } from '@nestjs/common';
import { VotesController } from './vote.controller';
import { VotesService } from './vote.service';


@Module({
  controllers: [VotesController],
  providers: [VotesService],
})
export class VoteModule {}
