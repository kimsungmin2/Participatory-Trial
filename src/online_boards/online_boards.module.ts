import { Module } from '@nestjs/common';
import { OnlineBoardsService } from './online_boards.service';
import { OnlineBoardsController } from './online_boards.controller';

@Module({
  controllers: [OnlineBoardsController],
  providers: [OnlineBoardsService],
})
export class OnlineBoardsModule {}
