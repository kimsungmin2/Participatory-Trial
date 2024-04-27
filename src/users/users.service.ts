import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInfos } from './entities/user-info.entity';
import { Users } from './entities/user.entity';
import { RedisService } from '../cache/redis.service';
import { Clients } from './entities/client.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserInfos)
    private readonly usersInfoRepository: Repository<UserInfos>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    private readonly redisService: RedisService,
    @InjectRepository(Clients)
    private clientsRepository: Repository<Clients>,
  ) {}

  async findByEmail(email: string): Promise<UserInfos> {
    const user = await this.usersInfoRepository.findOne({
      where: { email },
      select: ['id', 'nickName', 'email', 'birth', 'emailVerified'],
    });
    return user;
  }

  async findByMyId(id: number): Promise<UserInfos> {
    const data = await this.usersInfoRepository.findOne({
      where: { id },
      select: ['birth', 'nickName'],
    });

    return data;
  }

  async findById(id: number) {
    const userCache = await this.redisService.getCluster().get(`id:${id}`);

    if (userCache) {
      const userJson = JSON.parse(userCache);
      return userJson;
    }
    const user = await this.usersInfoRepository.findOne({
      where: { id },
      select: ['id', 'nickName'],
    });

    await this.redisService
      .getCluster()
      .set(`id:${id}`, JSON.stringify(user), 'EX', 60 * 60 * 24);
    return user;
  }

  async userUpdate(id: number, nickName: string) {
    const user = await this.usersInfoRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.usersInfoRepository.update(id, { nickName });
  }

  async userDelete(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.usersRepository.softDelete(id);
  }
  async updateClientsInfo(
    userId: number | null,
    subscriptionInfo: any,
  ): Promise<Clients> {
    if (userId == null) {
      await this.clientsRepository.delete({
        endpoint: subscriptionInfo.endpoint,
      });
      const clientId = uuidv4();
      const client = this.clientsRepository.create({
        clientId,
        endpoint: subscriptionInfo.endpoint,
        keys: subscriptionInfo.keys,
      });
      await this.clientsRepository.save(client);
      return client;
    }

    let client = await this.clientsRepository.findOne({ where: { userId } });
    if (!client || client.endpoint !== subscriptionInfo.endpoint) {
      await this.clientsRepository.delete({
        endpoint: subscriptionInfo.endpoint,
      });

      if (!client) {
        client = this.clientsRepository.create({
          userId,
          endpoint: subscriptionInfo.endpoint,
          keys: subscriptionInfo.keys,
        });
      } else {
        client.endpoint = subscriptionInfo.endpoint;
        client.keys = subscriptionInfo.keys;
      }
    } else {
      client.keys = subscriptionInfo.keys;
    }

    await this.clientsRepository.save(client);
    return client;
  }

  // async userReport(id: number, reportId: number, content: string) {
  //   const user = await this.usersInfoRepository.findOneBy({ id });
  //   if (!user) {
  //     throw new NotFoundException('사용자를 찾을 수 없습니다.');
  //   }
  //   // 각 컨트롤러마다 내려받는게 다름
  //   await this.reportRepository.save({ user_id: id, content });
  // }
}
