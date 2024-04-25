import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ChatsModule } from '../chats/chats.module';
// import { RedisPubSubService } from '../chats/redis.service';
import { OptionalWsJwtGuard } from '../utils/guard/ws.guard';
import { VoteModule } from '../trials/vote/vote.module';
import { RedisIoAdapter } from '../cache/redis.adpter';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { AlarmSchema } from '../schemas/alarm.schemas';
import { RedisModule } from '../cache/redis.module';
import { HumorVotes } from '../humors/entities/HumorVote.entity';
import { HumorsVotesModule } from '../humors/humors_votes/humors_votes.module';
import { PolticalDebatesModule } from '../poltical_debates/poltical_debates.module';
import { PolticalDebatesVoteModule } from '../poltical_debates/poltical_debates_vote/poltical_debates_vote.module';
import { LikeModule } from '../like/like.module';
import { AlarmModule } from '../alarm/alarm.module';

@Module({
  imports: [
    ChatsModule,
    VoteModule,
    HumorsVotesModule,
    PolticalDebatesVoteModule,
    LikeModule,
    AlarmModule,
  ],
  providers: [
    EventsGateway,
    OptionalWsJwtGuard,
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
