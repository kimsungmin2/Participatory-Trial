import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserInfos } from './entities/user-info.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserInfos)
    private readonly usersInfoRepository: Repository<UserInfos>,
    // @InjectRepository(Reports)
    // private readonly reportRepository: Repository<Reports>,
  ) {}

  async findByEmail(email: string): Promise<UserInfos> {
    const user = await this.usersInfoRepository.findOne({
      where: { email },
      select: ['id', 'nickName', 'email', 'birth'],
    });
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
  // async userReport(id: number, reportId: number, content: string) {
  //   const user = await this.usersInfoRepository.findOneBy({ id });
  //   if (!user) {
  //     throw new NotFoundException('사용자를 찾을 수 없습니다.');
  //   }
  //   // 각 컨트롤러마다 내려받는게 다름
  //   await this.reportRepository.save({ user_id: id, content });
  // }
}
