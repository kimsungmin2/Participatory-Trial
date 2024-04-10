import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ChatsModule } from '../chats/chats.module';
// import { RedisPubSubService } from '../chats/redis.service';
import { WsJwtGuard } from '../utils/guard/ws.guard';
import { VoteModule } from '../trials/vote/vote.module';

@Module({
  imports: [ChatsModule, VoteModule],
  providers: [EventsGateway, WsJwtGuard],
  exports: [EventsGateway],
})
export class EventsModule {}
