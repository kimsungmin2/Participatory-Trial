import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Alarm, AlarmDocument } from '../schemas/alarm.schemas';
import { Model } from 'mongoose';
import { RedisService } from '../cache/redis.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { Trials } from '../trials/entities/trial.entity';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { PolticalDebateBoards } from '../poltical_debates/entities/poltical_debate.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';

@Injectable()
export class AlarmService {
  constructor(
    @InjectModel(Alarm.name) private alarmModel: Model<AlarmDocument>,
    private readonly redisService: RedisService,
    @InjectRepository(Trials)
    private readonly trialsRepository: Repository<Trials>,
    @InjectRepository(HumorBoards)
    private readonly humorsRepository: Repository<HumorBoards>,
    @InjectRepository(PolticalDebateBoards)
    private readonly polticalsRepository: Repository<PolticalDebateBoards>,
    @InjectRepository(OnlineBoards)
    private readonly onlineBoardsRepository: Repository<OnlineBoards>,
  ) {}

  async createAlarm(
    userId: number,
    channelType: string,
    boardId: number,
    messageType: string,
  ) {
    const writerId = await this.findByBoardId(channelType, boardId);
    const alarmKey = `alarm:${writerId.userId}`;
    const alarmIdentifier = `${boardId}:${messageType}`;

    const timestamp = new Date().getTime();
    const alarm = {
      boardId: boardId,
      channelType: channelType,
      messageType: messageType,
    };

    const alarmValue = JSON.stringify(alarm);

    try {
      const redisCluster = this.redisService.getCluster();

      await redisCluster.zrem(alarmKey, alarmIdentifier);

      await redisCluster.zadd(alarmKey, timestamp, alarmValue);

      return true;
    } catch (error) {
      console.error('레디스 저장 에러:', error);
    }
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
      select: ['userId'],
    });

    await this.redisService
      .getCluster()
      .set(cacheKey, JSON.stringify(writerId), 'EX', 60 * 60 * 3);

    return writerId;
  }
}
