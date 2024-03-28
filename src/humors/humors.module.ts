import { Module } from '@nestjs/common';
import { HumorsService } from './humors.service';
import { HumorsController } from './humors.controller';

@Module({
  controllers: [HumorsController],
  providers: [HumorsService],
})
export class HumorsModule {}
