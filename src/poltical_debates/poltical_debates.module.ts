import { Module } from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { PolticalDebatesController } from './poltical_debates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolticalDebateBoards } from 'src/poltical_debates/entities/poltical_debate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PolticalDebateBoards])],
  controllers: [PolticalDebatesController],
  providers: [PolticalDebatesService],
})
export class PolticalDebatesModule {}
