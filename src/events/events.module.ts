import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ChatsModule } from '../chats/chats.module';
// import { RedisPubSubService } from '../chats/redis.service';
import { WsJwtGuard } from '../utils/guard/ws.guard';
import { VoteModule } from '../trials/vote/vote.module';
import { HumorsVotesModule } from '../humors/humors_votes/humors_votes.module';
import { PolticalDebatesVoteModule } from '../poltical_debates/poltical_debates_vote/poltical_debates_vote.module';
import { LikeModule } from '../like/like.module';

@Module({
  imports: [
    ChatsModule,
    VoteModule,
    HumorsVotesModule,
    PolticalDebatesVoteModule,
    LikeModule,
  ],
  providers: [EventsGateway, WsJwtGuard],
  exports: [EventsGateway],
})
export class EventsModule {}
