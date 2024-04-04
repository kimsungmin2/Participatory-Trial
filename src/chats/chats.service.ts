import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Users } from '../users/entities/user.entity';
import Redis from 'ioredis';
import { TrialsChannels } from '../events/entities/trialsChannel.entity';
import { TrialsChat } from '../events/entities/trialsChat.entity';
import { EventsGateway } from '../events/events.gateway';
import { ChannelTypeDto } from '../events/dto/channel.dto';
import { Chat } from '../events/entities/chat.entity';
import { ChannelType } from '../events/type/channeltype';

@Injectable()
export class ChatsService {
  private redisPublisher: Redis;

  constructor(
    @InjectRepository(TrialsChannels)
    private trialsChannelsRepository: Repository<TrialsChannels>,
    @InjectRepository(TrialsChat)
    private trialsChannelChatsRepository: Repository<TrialsChat>,
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {
    this.redisPublisher = new Redis();

    this.redisPublisher.on('connect', () => {
      console.log('연결완');
    });
  }

  async findChannelById(id: number) {
    return this.trialsChannelsRepository.findOne({ where: { id } });
  }

  async getRoomById(channelTypeDto: ChannelTypeDto, RoomId: number) {
    const { channelType } = channelTypeDto;
    let channelsRepository;
    let channelChatsRepository;
    let entityKey: 'trialChannelId' | 'humorChannelId' | 'polticalChannelId';

    switch (channelType) {
      case ChannelType.trials:
        channelsRepository = this.trialsChannelsRepository;
        channelChatsRepository = this.trialsChannelChatsRepository;
        entityKey = `trialChannelId`;
        break;
      //   case ChannelType.humors:
      //     channelsRepository = this.humorsChannelsRepository;
      //     channelChatsRepository = this.humorsChannelChatsRepository;
      //     entityKey = `humorChannelId`;
      //     break;
      //   default:
      //     channelsRepository = this.polticalsChannelsRepository;
      //     channelChatsRepository = this.polticalsChannelChatsRepository;
      //     entityKey = `polticalChannelId`;
      //     break;
    }
    const channel = await channelsRepository.findOneBy({ id: RoomId });
    if (channel) {
      throw new NotFoundException('없다');
    }
    return channel;
  }

  async createChannelChats(
    channelTypes: string,
    userId: number,
    message: string,
    RoomId: number,
  ) {
    try {
      const chat = new Chat();

      chat.message = message;
      chat.userId = userId;
      chat.RoomId = RoomId;

      const chatKey = `${channelTypes}:${RoomId}`;
      const chatValue = JSON.stringify(chat);

      await this.redisPublisher.rpush(chatKey, chatValue);

      await this.redisPublisher.expire(chatKey, 60 * 60 * 24 * 2);

      const publishResult = await new Promise((resolve, reject) => {
        this.redisPublisher.publish(
          'channelChats',
          JSON.stringify({
            channelType: channelTypes,
            RoomId: RoomId,
            message: message,
            userId: userId,
          }),
          (err, reply) => {
            if (err) reject(err);
            else resolve(reply);
          },
        );
      });

      console.log('펍:', publishResult);
    } catch (error) {
      console.error('채팅 생성에 실패하였습니다.', error);
      throw error;
    }
  }

  async getChannel(channelTypes: string, id: number): Promise<Chat[]> {
    const channelKey = `${channelTypes}:${id}`;

    try {
      const chatMessages = await this.redisPublisher.lrange(channelKey, 0, -1);

      const chats = chatMessages.map((message) => JSON.parse(message));

      return chats;
    } catch (error) {
      console.error('채널 채팅 메시지 조회에 실패하였습니다:', error);
      throw error;
    }
  }
}
