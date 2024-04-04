import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrialsChannels } from '../events/entities/trialsChannel.entity';
import { TrialsChat } from '../events/entities/trialsChat.entity';
import { Users } from '../users/entities/user.entity';
import { RedisPubSubService } from './redis.service';

@Module({
  imports: [TypeOrmModule.forFeature([TrialsChannels, TrialsChat, Users])],
  providers: [ChatsService],
  exports: [ChatsService],
})
export class ChatsModule {}
