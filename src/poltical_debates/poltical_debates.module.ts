import { Module } from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { PolticalDebatesController } from './poltical_debates.controller';

@Module({
  controllers: [PolticalDebatesController],
  providers: [PolticalDebatesService],
})
export class PolticalDebatesModule {}
