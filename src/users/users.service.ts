import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInfos } from './entities/user-info.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Users } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserInfos)
    private readonly usersInfoRepository: Repository<UserInfos>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    // @InjectRepository(Reports)
    // private readonly reportRepository: Repository<Reports>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async findByEmail(email: string): Promise<UserInfos> {
    const user = await this.usersInfoRepository.findOne({
      where: { email },
      select: ['id', 'nickName', 'email', 'birth'],
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

  async findById(id: number): Promise<UserInfos> {
    const userCache = await this.cacheManager.get<UserInfos>(`id:${id}`);

    if (userCache) {
      return userCache;
    }
    const user = await this.usersInfoRepository.findOne({
      where: { id },
      select: ['id'],
    });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    await this.cacheManager.set(`id:${id}`, user, 1000 * 60 * 60 * 24);
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
  // async userReport(id: number, reportId: number, content: string) {
  //   const user = await this.usersInfoRepository.findOneBy({ id });
  //   if (!user) {
  //     throw new NotFoundException('사용자를 찾을 수 없습니다.');
  //   }
  //   // 각 컨트롤러마다 내려받는게 다름
  //   await this.reportRepository.save({ user_id: id, content });
  // }
}
