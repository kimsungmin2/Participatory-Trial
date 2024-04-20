import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrialsChannels } from '../events/entities/trialsChannel.entity';
import { TrialsChat } from '../events/entities/trialsChat.entity';
import { Users } from '../users/entities/user.entity';
import { HumorsChat } from '../events/entities/humorsChat.entity';
import { PolticalsChat } from '../events/entities/polticalsChat.entity';
import { UserInfos } from '../users/entities/user-info.entity';
import Redis from 'ioredis';
import { RedisIoAdapter } from '../cache/redis.adpter';
import { MongooseModule } from '@nestjs/mongoose';
import { CatSchema } from 'src/cats/schemas/chat.schemas';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrialsChannels,
      TrialsChat,
      UserInfos,
      HumorsChat,
      PolticalsChat,
    ]),
    MongooseModule.forFeature([{ name: 'Chat', schema: CatSchema }])
  ],
  providers: [
    ChatsService,
    RedisIoAdapter,
    {
      provide: 'REDIS_DATA_CLIENT',
      useFactory: (redisAdapter: RedisIoAdapter) =>
        redisAdapter.getDataClient(),
      inject: [RedisIoAdapter],
    },
  ],
  exports: [ChatsService],
})
export class ChatsModule {}
