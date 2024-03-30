import { Module } from '@nestjs/common';
import { VoteService } from './vote.service';
import { VoteController } from './vote.controller';

@Module({
  controllers: [VoteController],
  providers: [VoteService],
})
export class VoteModule {}
