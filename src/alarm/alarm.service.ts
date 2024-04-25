import { Injectable } from '@nestjs/common';
import * as webPush from 'web-push';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { Trials } from '../trials/entities/trial.entity';
import { Clients } from '../users/entities/client.entity';
import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class PushService {
  constructor(
    @InjectRepository(Clients)
    private readonly clientsRepository: Repository<Clients>,
    @InjectRepository(Trials)
    private readonly trialsRepository: Repository<Trials>,
    @InjectRepository(HumorBoards)
    private readonly humorsRepository: Repository<HumorBoards>,
    @InjectRepository(PolticalDebateBoards)
    private readonly polticalsRepository: Repository<PolticalDebateBoards>,
    @InjectRepository(OnlineBoards)
    private readonly onlineBoardsRepository: Repository<OnlineBoards>,
    private readonly redisService: RedisService,
  ) {
    webPush.setVapidDetails(
      'mailto:tjdals1344@gmail.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    );
  }

  async sendNotification(
    channelType: string,
    boardId: number,
    messageType: string,
  ) {
    const writer = await this.findByBoardId(channelType, boardId);

    const client = await this.clientsRepository.findOne({
      where: { userId: writer.userId },
      select: ['endpoint', 'keys'],
    });

    if (!client) {
      console.error('Client not found');
      return;
    }

    let message;
    switch (messageType) {
      case 'chat':
        message = '채팅이';
        break;
      case 'votes':
        message = `${channelType}:${boardId}투표가 핫합니다.`;
        break;
      case 'like':
        message = '좋아요가';
        break;
    }

    const payload = {
      title: '국민 참여 재판',
      body: message,
      data: {
        channelType,
        boardId,
      },
    };

    const subscription = {
      endpoint: client.endpoint,
      keys: {
        p256dh: client.keys.p256dh,
        auth: client.keys.auth,
      },
    };

    try {
      await webPush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
      if (error.statusCode === 410) {
        await this.clientsRepository.delete({ userId: writer.userId });
      }
    }
  }

  async sendAllNotifications(
    channelType: string,
    boardId: number,
    messageType: string,
  ) {
    let message;
    switch (messageType) {
      case 'chat':
        message = '채팅이 시작되었습니다.';
        break;
      case 'votes':
        message = `${channelType}:${boardId} 투표가 핫합니다.`;
        break;
      case 'like':
        message = '좋아요가 많이 받았습니다.';
        break;
    }

    const payload = {
      title: '국민 참여 재판',
      body: message,
      data: { channelType, boardId },
    };

    const clients = await this.clientsRepository.find();
    const promises = clients.map((client) => {
      const subscription = {
        endpoint: client.endpoint,
        keys: {
          p256dh: client.keys.p256dh,
          auth: client.keys.auth,
        },
      };

      return webPush
        .sendNotification(subscription, JSON.stringify(payload))
        .catch(async (error) => {
          console.error('Notification send error:', error);
          if (error.statusCode === 410) {
            await this.clientsRepository.delete({ clientId: client.clientId });
          }
        });
    });

    await Promise.all(promises);
  }

  async findByBoardId(channelType: string, boardId: number) {
    const cacheKey = `writerId:${channelType}:${boardId}`;

    const cachedWriterId = await this.redisService.getCluster().get(cacheKey);

    if (cachedWriterId) {
      return JSON.parse(cachedWriterId);
    }

    let channelRepository: Repository<any>;
    switch (channelType) {
      case 'trials':
        channelRepository = this.trialsRepository;
        break;
      case 'humors':
        channelRepository = this.humorsRepository;
        break;
      case 'political-debates':
        channelRepository = this.polticalsRepository;
        break;
      case 'online-boards':
        channelRepository = this.onlineBoardsRepository;
        break;
    }

    const writerId = await channelRepository.findOne({
      where: { id: boardId },
      select: ['userId', 'title'],
    });

    await this.redisService
      .getCluster()
      .set(cacheKey, JSON.stringify(writerId), 'EX', 60 * 60 * 3);

    return writerId;
  }
}
