import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ChatsModule } from '../chats/chats.module';
// import { RedisPubSubService } from '../chats/redis.service';
import { WsJwtGuard } from '../utils/guard/ws.guard';
import { VoteModule } from '../trials/vote/vote.module';
import { RedisIoAdapter } from '../cache/redis.adpter';

@Module({
  imports: [ChatsModule, VoteModule],
  providers: [
    EventsGateway,
    WsJwtGuard,
    RedisIoAdapter,
    {
      provide: 'REDIS_SUB_CLIENT',
      useFactory: (redisAdapter: RedisIoAdapter) => redisAdapter.getSubClient(),
      inject: [RedisIoAdapter],
    },
  ],
  exports: [EventsGateway],
})
export class EventsModule {}
