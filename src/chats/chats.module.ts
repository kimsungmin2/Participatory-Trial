import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrialsChannels } from '../events/entities/trialsChannel.entity';
import { TrialsChat } from '../events/entities/trialsChat.entity';
import { UserInfos } from '../users/entities/user-info.entity';
import { RedisIoAdapter } from '../cache/redis.adpter';
import { HumorsChat } from '../events/entities/humorsChat.entity';
import { PolticalsChat } from '../events/entities/polticalsChat.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { CatSchema } from '../schemas/chat.schemas';
import { AlarmModule } from '../alarm/alarm.module';
import { NicknameGeneratorService } from './nickname.service';
import { PushService } from '../alarm/alarm.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrialsChannels,
      TrialsChat,
      UserInfos,
      HumorsChat,
      PolticalsChat,
    ]),
    MongooseModule.forFeature([{ name: 'Chat', schema: CatSchema }]),
    AlarmModule,
  ],
  providers: [
    ChatsService,
    RedisIoAdapter,
    NicknameGeneratorService,
    {
      provide: 'REDIS_DATA_CLIENT',
      useFactory: (redisAdapter: RedisIoAdapter) =>
        redisAdapter.getDataClient(),
      inject: [RedisIoAdapter],
    },
  ],
  exports: [ChatsService, RedisIoAdapter, NicknameGeneratorService],
})
export class ChatsModule {}
