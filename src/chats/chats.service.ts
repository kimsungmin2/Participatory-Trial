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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatDocument } from '../schemas/chat.schemas';
import { FcmService } from '../alarm/fcm.service';
import { NicknameGeneratorService } from './nickname.service';

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
    @Inject('REDIS_DATA_CLIENT') private redisDataClient: Redis,
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    private readonly alarmService: FcmService,
    private readonly nickNameService: NicknameGeneratorService,
  ) {}

  async publishNotification(message: string) {
    const channelName = 'notifications';
    await this.redisDataClient.publish(channelName, message);
  }

  async userPublishNotification(message: string) {
    const channelName = 'userNotifications';
    await this.redisDataClient.publish(channelName, message);
  }

  async onModuleInit() {
    this.handleScheduledTasks();
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
      const [channelType, roomId] = key.split(':chat:');

      await this.saveMessagesToDatabase(messages, channelType, +roomId);

      await this.redisDataClient.ltrim(key, -retainCount, -1);
    }
  }

  async saveMessagesToDatabase(
    messages: string[],
    channelType: string,
    roomId: number,
  ) {
    const chats = [];
    for (const message of messages) {
      const parsedMessage = JSON.parse(message);
      const user = await this.usersInfoRepository.findOne({
        where: { id: parsedMessage.userId },
        select: ['nickName'],
      });

      chats.push(
        new this.chatModel({
          message: parsedMessage.message,
          userId: parsedMessage.userId,
          RoomId: roomId,
          timestamp: parsedMessage.timestamp,
          userName: user ? user.nickName : 'Unknown User',
          channelType: channelType,
        }),
      );
    }
    try {
      await this.chatModel.insertMany(chats);
    } catch (error) {
      console.log('몽고 디비 저장 중 오류가 발생했습니다.:', error);
    }
  }

  async createChannelChat(
    channelType: string,
    userId: number | null,
    message: string,
    roomId: number,
    ip: string,
  ) {
    try {
      let userName = await this.redisDataClient.get(`userName:${ip}`);

      if (!userName) {
        userName = this.nickNameService.generateNickname();
        await this.redisDataClient.set(
          `userName:${ip}`,
          userName,
          'EX',
          60 * 60 * 24,
        );
      }

      if (userId) {
        userName = await this.redisDataClient.get(`userName:${userId}`);
        if (!userName) {
          const user = await this.usersInfoRepository.findOne({
            where: { id: userId },
            select: ['nickName'],
          });
          if (user) {
            userName = user.nickName;
            await this.redisDataClient.set(
              `userName:${userId}`,
              userName,
              'EX',
              60 * 60 * 24,
            );
          } else {
            throw new Error('유저가 없음');
          }
        }
      }

      const chat = new Chat();
      chat.message = message;
      chat.userId = userId || undefined;
      chat.RoomId = roomId;
      chat.timestamp = new Date();
      chat.userName = userName;

      const chatKey = `${channelType}:chat:${roomId}`;
      const chatValue = JSON.stringify(chat);

      await this.redisDataClient.rpush(chatKey, chatValue);
      await this.redisDataClient.expire(chatKey, 60 * 60 * 24 * 2);
      await this.redisDataClient.publish(chatKey, chatValue);

      await this.alarmService.sendPushNotification(channelType, roomId, 'chat');

      return userName;
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
    const channelKey = `${channelType}:chat:${roomId}`;
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
        const dbStartIndex =
          page > 0 ? page * limit - Math.min(redisMessageCount, limit) : 0;

        const dbChatMessages = await this.chatModel
          .find({ RoomId: roomId })
          .sort({ timestamp: 'asc' })
          .skip(dbStartIndex)
          .limit(limit)
          .exec();

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
