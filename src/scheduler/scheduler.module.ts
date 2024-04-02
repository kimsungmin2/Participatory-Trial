import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { UpdateViewsScheduler } from './updateViews.sceduler';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([HumorBoards, OnlineBoards]),
  ],
  providers: [UpdateViewsScheduler],
})
export class SchedulerModule {}
