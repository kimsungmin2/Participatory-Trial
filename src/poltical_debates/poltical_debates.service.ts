import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
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
      throw new BadRequestException('정치 토론 게시판을 찾을 수 없습니다.');
    }

    return findOnePolticalDebateBoard;
  }

  async update(
    userInfo: Users,
    id: number,
    updatePolticalDebateDto: UpdatePolticalDebateDto,
  ) {
    const userId = userInfo.id;

    const polticalDebateBoard = await this.polticalDebateRepository.findOne({
      where: { id },
    });

    if (!polticalDebateBoard) {
      throw new NotFoundException('정치 토론 게시판을 찾을 수 없습니다.');
    }

    if (polticalDebateBoard.userId !== userId) {
      throw new UnauthorizedException('게사판을 수정할 권한이 없습니다.');
    }

    const existingViewCount = polticalDebateBoard.view;

    const updateBoard = await this.polticalDebateRepository.update(
      polticalDebateBoard.id,
      { ...updatePolticalDebateDto, view: existingViewCount },
    );

    return updateBoard;
  }
  async delete(userInfo: Users, id: number) {
    const userId = userInfo.id;

    const politicalDebateBoard = await this.polticalDebateRepository.findOne({
      where: { id },
    });

    if (!politicalDebateBoard) {
      throw new NotFoundException('존재하지 않는 정치 토론 게시판입니다.');
    }

    if (politicalDebateBoard.userId !== userId) {
      throw new UnauthorizedException('게시판를 삭제할 권한이 없습니다.');
    }

    const deleteBoard =
      await this.polticalDebateRepository.delete(politicalDebateBoard);

    return deleteBoard;
  }
}
