import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInfos } from './entities/user-info.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserInfos)
    private readonly usersInfoRepository: Repository<UserInfos>,
  ) {}

  async findByEmail(email: string) {
    const user = await this.usersInfoRepository.findOne({ where: { email } });
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
    const user = await this.usersInfoRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return this.usersInfoRepository.delete(id);
  }
}
