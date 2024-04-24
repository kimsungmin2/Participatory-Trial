import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { HumorBoards } from '../humors/entities/humor-board.entity';
import { OnlineBoards } from '../online_boards/entities/online_board.entity';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
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
        .scan(cursor, 'MATCH', 'humors:*:view');
      cursor = reply[0];
      const keys = reply[1];
      keysBatch = keysBatch.concat(keys);
    } while (cursor !== '0');

    if (keysBatch.length > 0) {
      const values = await this.redisService.getCluster().mget(...keysBatch); // 여러 키에 대한 값을 한 번에 조회
      keysBatch.forEach(async (key, index) => {
        const viewCount = values[index]; // mget 결과에서 해당 키의 값을 가져옴
        const match = key.match(/humors:(.*):view/);
        if (match && viewCount) {
          const id = match[1];
          await this.humorBoardRepository
            .createQueryBuilder()
            .update(HumorBoards)
            .set({ view: () => `view + ${viewCount}` })
            .where('id = :id', { id: Number(id) })
            .execute();
          console.log(`유머게시판 ${id}번째 게시물 조회수 업데이트 완료!`);
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
        .scan(cursor, 'MATCH', 'online:*:view');
      cursor = reply[0];
      const keys = reply[1];
      keysBatch = keysBatch.concat(keys);
    } while (cursor !== '0');

    if (keysBatch.length > 0) {
      const values = await this.redisService.getCluster().mget(...keysBatch); // 여러 키에 대한 값을 한 번에 조회
      keysBatch.forEach(async (key, index) => {
        const viewCount = values[index]; // mget 결과에서 해당 키의 값을 가져옴
        const match = key.match(/online:(.*):view/);
        if (match && viewCount) {
          const id = match[1];
          await this.onlineBoardRepository
            .createQueryBuilder()
            .update(OnlineBoards)
            .set({ view: () => `view + ${viewCount}` })
            .where('id = :id', { id: Number(id) })
            .execute();
          console.log(`자유게시판 ${id}번째 게시물 조회수 업데이트 완료!`);
          await this.redisService.getCluster().del(key);
        }
      });
    }
    console.log('=======자유 게시판 조회수 업데이트 완료!=======');
  }

  @Cron('0 * * * * *', { name: 'polticalDebatesView' })
  async polticalDebatesView() {
    let cursor = '0';
    let keysBatch = [];
    do {
      const reply = await this.redisService
        .getCluster()
        .scan(cursor, 'MATCH', 'polticalDebate:*:view');
      cursor = reply[0];
      const keys = reply[1];
      keysBatch = keysBatch.concat(keys);
    } while (cursor !== '0');

    if (keysBatch.length > 0) {
      const values = await this.redisService.getCluster().mget(...keysBatch); // 여러 키에 대한 값을 한 번에 조회
      keysBatch.forEach(async (key, index) => {
        const viewCount = values[index]; // mget 결과에서 해당 키의 값을 가져옴
        const match = key.match(/online:(.*):view/);
        if (match && viewCount) {
          const id = match[1];
          await this.onlineBoardRepository
            .createQueryBuilder()
            .update(OnlineBoards)
            .set({ view: () => `view + ${viewCount}` })
            .where('id = :id', { id: Number(id) })
            .execute();
          console.log(
            `정치 토론 게시판 ${id}번째 게시물 조회수 업데이트 완료!`,
          );
          await this.redisService.getCluster().del(key);
        }
      });
    }
    console.log('=======정치 토론 게시판 조회수 업데이트 완료!=======');
  }
}

//1올라갈때마다 업데이트 o(n)
//캐싱해서 업데이트 o(1*업데이트해야하는 게시물의 수)

/**
 * VER.1
 *  async updateView() {
    let cursor = '0';
    do {
      const reply = await this.redis.scan(cursor, 'MATCH', 'humors:*:view');
      cursor = reply[0];
      const keys = reply[1];
      const idPattern = /humors:(.*):view/;

      for (let key of keys) {
        const match = key.match(idPattern);
        if (match) {
          const id = match[1];
          const viewCount = await this.redis.get(key);
          const updateView = await this.humorBoardRepository
            .createQueryBuilder()
            .update(HumorBoards)
            .set({ view: () => `view + ${viewCount}` })
            .where('id = :id', { id: Number(id) })
            .execute();
          console.log(`유머게시판 ${id}번째 게시물 조회수 업데이트 완료!`);
        }
      }
    } while (cursor !== '0');
  }
 */
