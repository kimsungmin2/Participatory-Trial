import { Module } from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { PolticalDebatesController } from './poltical_debates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PolticalDebateBoards } from './entities/poltical_debate.entity';
import { PolticalDebateComments } from './entities/poltical_debate_comments.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PolticalDebateBoards, PolticalDebateComments]),
  ],
  controllers: [PolticalDebatesController],
  providers: [PolticalDebatesService],
})
export class PolticalDebatesModule {}
