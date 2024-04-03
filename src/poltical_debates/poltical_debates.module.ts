import { Module } from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { PolticalDebatesController } from './poltical_debates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolticalDebateCommentsService } from './poltical_debate_comments.service';
import { PolticalDebateBoards } from './entities/poltical_debate.entity';
import { PolticalDebateComments } from './entities/poltical_debate_comments.entity';
import { PolticalDebateCommentsController } from './poltical_debate_comments.controller';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PolticalDebateBoards, PolticalDebateComments]),
    S3Module,
  ],
  controllers: [PolticalDebatesController, PolticalDebateCommentsController],
  providers: [PolticalDebatesService, PolticalDebateCommentsService],
})
export class PolticalDebatesModule {}
