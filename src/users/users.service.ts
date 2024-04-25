import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInfos } from './entities/user-info.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Users } from './entities/user.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import * as Redis from 'ioredis';
import { RedisService } from '../cache/redis.service';
import { ClientsDto } from './dto/client.dto';
import { Clients } from './entities/client.entity';

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
      select: ['id'],
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
    const code = Math.floor(Math.random() * 900000) + 100000;
    await this.redisService
      .getCluster()
      .set(`id:${code}`, code, 'EX', 60 * 60 * 3);

    return this.usersInfoRepository.update(id, { nickName });
  }

  async userDelete(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.usersRepository.softDelete(id);
  }

  async updateClientsInfo(clientsDto: ClientsDto) {
    const { userId, clientId, pushToken } = clientsDto;

    let clientsInfo = await this.clientsRepository.findOne({
      where: { pushToken: pushToken, clientId: clientId, userId: userId },
    });

    let area;
    let updateNeeded = false;

    if (clientsInfo) {
      const isUpdated = clientsInfo.pushToken !== pushToken;
      if (isUpdated) {
        Object.assign(clientsInfo, clientsDto);
        updateNeeded = true;
      }
    } else {
      clientsInfo = this.clientsRepository.create(clientsDto);
      updateNeeded = true;
    }

    if (updateNeeded) {
      await this.clientsRepository.save(clientsInfo);
    }

    return { clientsInfo, area };
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
