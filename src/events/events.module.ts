import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ChatsModule } from '../chats/chats.module';
// import { RedisPubSubService } from '../chats/redis.service';
import { WsJwtGuard } from '../utils/guard/ws.guard';
import { VoteModule } from '../trials/vote/vote.module';
import { HumorsVotesModule } from '../humors/humors_votes/humors_votes.module';
import { PolticalDebatesVoteModule } from '../poltical_debates/poltical_debates_vote/poltical_debates_vote.module';
import { RedisIoAdapter } from '../cache/redis.adpter';

@Module({
  imports: [
    ChatsModule,
    VoteModule,
    HumorsVotesModule,
    PolticalDebatesVoteModule,
  ],
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
