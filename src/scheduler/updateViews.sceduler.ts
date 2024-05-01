import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { Repository } from 'typeorm';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class UpdateViewsScheduler {
  constructor(
    @InjectRepository(HumorBoards)
    private humorBoardRepository: Repository<HumorBoards>,
    @InjectRepository(OnlineBoards)
    private onlineBoardRepository: Repository<OnlineBoards>,
    private readonly redisService: RedisService,
  ) {}
  @Cron('0 * * * * *', { name: 'updateViewTest' })
  async humorUpdateView() {
    let cursor = '0';
    let keysBatch = [];
    do {
      const reply = await this.redisService
        .getCluster()
        .scan(cursor, 'MATCH', '{humors}:*:view');
      console.log(reply);
      cursor = reply[0];
      const keys = reply[1];
      keysBatch = keysBatch.concat(keys);
      console.log(keysBatch);
    } while (cursor !== '0');

    if (keysBatch.length > 0) {
      const values = await this.redisService.getCluster().mget(...keysBatch);
      keysBatch.forEach(async (key, index) => {
        const viewCount = values[index];
        const match = key.match(/{humors}:(.*):view/);
        if (match && viewCount) {
          const id = match[1];
          const result = await this.humorBoardRepository
            .createQueryBuilder()
            .update(HumorBoards)
            .set({ view: () => `view + ${viewCount}` })
            .where('id = :id', { id: Number(id) })
            .execute();
          console.log(result);
          await this.redisService.getCluster().del(key);
        }
      });
    }
    console.log('=======유머 게시판 조회수 업데이트 완료!=======');
  }
  @Cron('0 * * * * *', { name: 'onlineViewTest' })
  async onlineUpdateView() {
    let cursor = '0';
    let keysBatch = [];
    do {
      const reply = await this.redisService
        .getCluster()
        .scan(cursor, 'MATCH', '{online}:*:view');
      cursor = reply[0];
      const keys = reply[1];
      keysBatch = keysBatch.concat(keys);
      console.log('online', keysBatch);
    } while (cursor !== '0');

    if (keysBatch.length > 0) {
      const values = await this.redisService.getCluster().mget(...keysBatch);
      keysBatch.forEach(async (key, index) => {
        const viewCount = values[index];
        const match = key.match(/{online}:(.*):view/);
        if (match && viewCount) {
          const id = match[1];
          await this.onlineBoardRepository
            .createQueryBuilder()
            .update(OnlineBoards)
            .set({ view: () => `view + ${viewCount}` })
            .where('id = :id', { id: Number(id) })
            .execute();
          await this.redisService.getCluster().del(key);
        }
      });
    }
    console.log('=======자유 게시판 조회수 업데이트 완료!=======');
  }
}
