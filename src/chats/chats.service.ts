import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Users } from '../users/entities/user.entity';
import Redis from 'ioredis';
import { Chat } from '../events/entities/chat.entity';
import { Interval } from '@nestjs/schedule';
import { TrialsChat } from '../events/entities/trialsChat.entity';
import { HumorsChat } from '../events/entities/humorsChat.entity';
import { PolticalsChat } from '../events/entities/polticalsChat.entity';
import { CustomSocket } from '../utils/interface/socket.interface';
import { ChannelType } from '../events/type/channeltype';
import { UserInfos } from '../users/entities/user-info.entity';

@Injectable()
export class ChatsService implements OnModuleInit {
  constructor(
    @InjectRepository(UserInfos)
    private usersInfoRepository: Repository<UserInfos>,
    @InjectRepository(TrialsChat)
    private readonly trialsChatRepository: Repository<TrialsChat>,
    @InjectRepository(HumorsChat)
    private readonly humorsChatRepository: Repository<HumorsChat>,
    @InjectRepository(PolticalsChat)
    private readonly polticalsChatRepository: Repository<PolticalsChat>,
    private readonly dataSource: DataSource,
    @Inject('REDIS_DATA_CLIENT') private redisDataClient: Redis, // Redis 데이터 클라이언트를 주입
    @Inject('REDIS_SUB_CLIENT') private redisSubClient: Redis,
  ) {}

  async publishNotification(message: string) {
    const channelName = 'notifications';
    await this.redisDataClient.publish(channelName, message);
  }

  async onModuleInit() {
    this.handleScheduledTasks();
  }
  async onModuleDestroy() {
    await this.redisDataClient.quit();
    await this.redisSubClient.quit();
    console.log('Redis 클라이언트 연결이 종료되었습니다.');
  }

  @Interval(1000 * 60)
  async handleScheduledTasks() {
    // await this.redisConnection();

    for (const channelType of Object.values(ChannelType)) {
      let cursor = '0';
      const tasks = [];

      do {
        const [nextCursor, keys] = await this.redisDataClient.scan(
          cursor,
          'MATCH',
          `${channelType}:*`,
          'COUNT',
          100,
        );
        cursor = nextCursor;

        if (keys.length === 0) continue;

        for (const key of keys) {
          tasks.push(this.processKey(key));

          if (tasks.length >= 500) {
            await Promise.all(tasks.splice(0, 500));
          }
        }
      } while (cursor !== '0');

      await Promise.all(tasks);
    }
  }

  async processKey(key: string) {
    const retainCount = 50;
    const messages = await this.redisDataClient.lrange(
      key,
      0,
      -retainCount - 1,
    );

    if (messages.length > 0) {
      const [channelType, roomId] = key.split(':');

      await this.saveMessagesToDatabase(messages, channelType, +roomId, key);

      await this.redisDataClient.ltrim(key, -retainCount, -1);
    }
  }

  async saveMessagesToDatabase(
    messages: string[],
    channelType: string,
    roomId: number,
    redisKey: string,
  ) {
    let channelChatsRepository: Repository<any>;
    let ChatEntity:
      | typeof TrialsChat
      | typeof HumorsChat
      | typeof PolticalsChat;

    switch (channelType) {
      case 'trials':
        channelChatsRepository = this.trialsChatRepository;
        ChatEntity = TrialsChat;
        break;
      case 'humors':
        channelChatsRepository = this.humorsChatRepository;
        ChatEntity = HumorsChat;
        break;
      case 'polticals':
        channelChatsRepository = this.polticalsChatRepository;
        ChatEntity = PolticalsChat;
        break;
    }

    const chats = [];
    for (const message of messages) {
      const parsedMessage = JSON.parse(message);
      const user = await this.usersInfoRepository.findOne({
        where: { id: parsedMessage.userId },
        select: ['nickName'],
      });

      const chat = new ChatEntity();
      chat.message = parsedMessage.message;
      chat.userId = parsedMessage.userId;
      chat.roomId = roomId;
      chat.timestamp = new Date(parsedMessage.timestamp);
      chat.userName = user ? user.nickName : 'Unknown User';

      chats.push(chat);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await channelChatsRepository.save(chats);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async createChannelChat(
    channelType: string,
    userId: number,
    message: string,
    roomId: number,
  ) {
    try {
      // await this.redisConnection();
      const user = await this.usersInfoRepository.findOne({
        where: { id: userId },
        select: ['nickName'],
      });
      const chat = new Chat();
      chat.message = message;
      chat.userId = userId;
      chat.RoomId = roomId;
      chat.timestamp = new Date();
      chat.userName = user.nickName;

      const chatKey = `${channelType}:${roomId}`;
      const chatValue = JSON.stringify(chat);

      await this.redisDataClient.rpush(chatKey, chatValue);
      await this.redisDataClient.expire(chatKey, 60 * 60 * 24 * 2);

      await this.redisDataClient.publish(chatKey, chatValue);

      return user;
    } catch (error) {
      throw error;
    }
  }

  // async redisConnection(attempt = 0) {
  //   const maxRetries = 3;
  //   const retryDelay = 1000;

  //   if (attempt >= maxRetries) {
  //     throw new Error('레디스 연결 실패: 최대 재시도 횟수 초과');
  //   }

  //   try {
  //     await this.redisDataClient.ping();
  //   } catch (error) {
  //     console.error(
  //       `레디스 연결 실패, 재시도 ${attempt + 1}/${maxRetries}`,
  //       error,
  //     );
  //     await new Promise((resolve) => setTimeout(resolve, retryDelay));
  //     return this.redisConnection(attempt + 1);
  //   }
  // }

  async getChannel(
    channelType: string,
    roomId: number,
    page: number = 0,
    limit: number = 50,
  ): Promise<Chat[]> {
    // await this.redisConnection();

    const channelKey = `${channelType}:${roomId}`;
    const redisMessageCount = await this.redisDataClient.llen(channelKey);

    let chats = [];

    try {
      if (page === 0) {
        const chatMessages = await this.redisDataClient.lrange(
          channelKey,
          0,
          -1,
        );
        if (chatMessages.length > 0) {
          chats = chatMessages.map((message) => JSON.parse(message));
        }
      }

      if (redisMessageCount < limit || page > 0) {
        let channelChatsRepository: Repository<any>;
        switch (channelType) {
          case 'trials':
            channelChatsRepository = this.trialsChatRepository;
            break;
          case 'humors':
            channelChatsRepository = this.humorsChatRepository;
            break;
          case 'polticals':
            channelChatsRepository = this.polticalsChatRepository;
            break;
        }

        const dbStartIndex =
          page > 0 ? page * limit - Math.min(redisMessageCount, limit) : 0;

        const dbChatMessages = await channelChatsRepository.find({
          where: { roomId: roomId },
          order: { timestamp: 'ASC' },
          skip: dbStartIndex,
          take: limit,
        });

        if (page === 0 && chats.length > 0) {
          chats = [...chats, ...dbChatMessages];
        } else {
          chats = dbChatMessages;
        }
      }

      return chats;
    } catch (error) {
      throw error;
    }
  }

  async publishEvent(roomId: number, event: string, data: any) {
    const channelName = `roomEvents:${roomId}`;
    await this.redisDataClient.publish(
      channelName,
      JSON.stringify({ event, data }),
    );
  }
}
