import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PolticalDebateBoards } from 'src/poltical_debates/entities/poltical_debate.entity';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';

@Injectable()
export class PolticalDebatesService {
  constructor(
    @InjectRepository(PolticalDebateBoards)
    private readonly polticalDebateRepository: Repository<PolticalDebateBoards>,
    private readonly usersService: UsersService,
  ) {}
  async create(
    userInfo: UserInfos,
    createPolticalDebateDto: CreatePolticalDebateDto,
  ) {
    await this.usersService.findByUserId(userInfo.id);

    const createPolticalDebate = this.polticalDebateRepository.save({
      ...createPolticalDebateDto,
    });
    return createPolticalDebate;
  }

  async findAll() {
    const findAllPolticalDebateBoard =
      await this.polticalDebateRepository.find();

    return findAllPolticalDebateBoard;
  }

  async myfindAll(userInfo: UserInfos) {
    const user = await this.usersService.findByUserId(userInfo.id);

    const myPolticalDebateBoard = await this.polticalDebateRepository.find({
      where: { user },
    });
    return myPolticalDebateBoard;
  }

  async findOne(id: number) {
    const find_one_poltical_debate_board =
      await this.polticalDebateRepository.findOne({
        where: { id },
      });

    if (!find_one_poltical_debate_board) {
      throw new BadRequestException('존재하지 않는 정치 토론방입니다.');
    }

    return find_one_poltical_debate_board;
  }

  async myfindOne(userInfo: UserInfos, id: number) {
    const user = await this.usersService.findByUserId(userInfo.id);

    const myPolticalDebateBoard = await this.polticalDebateRepository.findOne({
      where: { id, user: user },
    });

    if (!myPolticalDebateBoard) {
      throw new BadRequestException('존재하지 않는 정치 토론방입니다.');
    }

    return myPolticalDebateBoard;
  }

  async update(
    userInfo: UserInfos,
    id: number,
    createPolticalDebateDto: CreatePolticalDebateDto,
  ) {
    const user = await this.usersService.findByUserId(userInfo.id);

    const polticalDebateBoard = await this.polticalDebateRepository.findOne({
      where: { id, user },
    });

    if (!polticalDebateBoard) {
      throw new NotFoundException('해당하는 정치 토론방을 찾을 수 없습니다.');
    }

    const updatedpolticalDebateBoard =
      await this.polticalDebateRepository.update(
        polticalDebateBoard.id,
        createPolticalDebateDto,
      );

    return updatedpolticalDebateBoard;
  }

  async delete(userInfo: UserInfos, id: number) {
    const user = await this.usersService.findByUserId(userInfo.id);

    const existingPolticalDebate = await this.polticalDebateRepository.findOne({
      where: { id, user: user },
    });

    if (!existingPolticalDebate) {
      throw new BadRequestException('존재하지 않는 정치 토론방입니다.');
    }

    await this.polticalDebateRepository.remove(existingPolticalDebate);
  }
}
