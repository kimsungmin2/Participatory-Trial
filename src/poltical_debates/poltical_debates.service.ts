import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdatePolticalDebateDto } from 'src/poltical_debates/dto/update-poltical_debate.dto';
import { PolticalDebateBoards } from 'src/poltical_debates/entities/poltical_debate.entity';
import { UserInfos } from 'src/users/entities/user-info.entity';
import { Users } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';

@Injectable()
export class PolticalDebatesService {
  constructor(
    @InjectRepository(PolticalDebateBoards)
    private readonly polticalDebateRepository: Repository<PolticalDebateBoards>,
  ) {}
  async create(
    userInfo: Users,
    createPolticalDebateDto: CreatePolticalDebateDto,
  ) {
    const { title, content } = createPolticalDebateDto;

    const defaultViewCount = 1;

    const createdPolticalDebate = this.polticalDebateRepository.create({
      title,
      content,
      view: defaultViewCount,
      userId: userInfo.id,
    });

    return this.polticalDebateRepository.save(createdPolticalDebate);
  }

  async findAll() {
    const findAllPolticalDebateBoard = await this.polticalDebateRepository.find(
      {
        order: { id: 'ASC' },
      },
    );

    return findAllPolticalDebateBoard;
  }

  async findMyBoards(userId: number) {
    return this.polticalDebateRepository.find({
      where: { userId },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const findOnePolticalDebateBoard =
      await this.polticalDebateRepository.findOne({
        where: { id },
      });

    if (!findOnePolticalDebateBoard) {
      throw new BadRequestException('존재하지 않는 정치 토론방입니다.');
    }

    return findOnePolticalDebateBoard;
  }

  async update(
    userInfo: UserInfos,
    id: number,
    updatePolticalDebateDto: UpdatePolticalDebateDto,
  ) {
    const userId = userInfo.id;

    const polticalDebateBoard = await this.polticalDebateRepository.findOne({
      where: { id, userId },
    });

    if (!polticalDebateBoard) {
      throw new NotFoundException('해당하는 정치 토론방을 찾을 수 없습니다.');
    }

    const existingViewCount = polticalDebateBoard.view;

    const updateBoard = await this.polticalDebateRepository.update(
      polticalDebateBoard.id,
      { ...updatePolticalDebateDto, view: existingViewCount },
    );

    return updateBoard;
  }

  async delete(userInfo: UserInfos, id: number) {
    const userId = userInfo.id;
    const existingPolticalDebate = await this.polticalDebateRepository.findOne({
      where: { id, userId },
    });

    if (!existingPolticalDebate) {
      throw new BadRequestException('존재하지 않는 정치 토론방입니다.');
    }

    await this.polticalDebateRepository.remove(existingPolticalDebate);
  }
}
