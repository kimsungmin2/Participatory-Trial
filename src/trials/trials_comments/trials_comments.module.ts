import { Module } from '@nestjs/common';
import { TrialsCommentsService } from './trials_comments.service';
import { TrialsCommentsController } from './trials_comments.controller';

@Module({
  controllers: [TrialsCommentsController],
  providers: [TrialsCommentsService],
})
export class TrialsCommentsModule {}
