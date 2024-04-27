import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AlarmSchema } from '../schemas/alarm.schemas';
import { RedisModule } from '../cache/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trials } from '../trials/entities/trial.entity';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
import { Clients } from '../users/entities/client.entity';
import { PushService } from './alarm.service';

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
  providers: [PushService],
  exports: [PushService],
})
export class AlarmModule {}
