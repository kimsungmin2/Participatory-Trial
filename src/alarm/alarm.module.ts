import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AlarmSchema } from '../schemas/alarm.schemas';
import { RedisModule } from '../cache/redis.module';
import { AlarmService } from './alarm.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trials } from '../trials/entities/trial.entity';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
import { FcmService } from './fcm.service';
import { Clients } from '../users/entities/client.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Trials,
      HumorBoards,
      OnlineBoards,
      PolticalDebateBoards,
      Clients,
    ]),
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([{ name: 'Alarm', schema: AlarmSchema }]),
    RedisModule,
  ],
  providers: [FcmService],
  exports: [FcmService],
})
export class AlarmModule {}
